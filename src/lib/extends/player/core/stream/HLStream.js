import AbstractStream from './AbstractStream'
import request from '@/lib/request'
import M3U8Parser from '../parser/M3U8Parser';
import BinarySearch from "../BinarySearch"
import { HLSEvent, MediaEvent } from '../../event';

import { Demuxer } from './demux';
let axios = require('axios');

const STATE = {
    ERROR: "error",
    STARTING: "starting",
    IDLE: "idle",
    KEY_LOADING: "key_loading",
    FRAG_LOADING: "frag_loading",
    WAITING_LEVEL: "wating_level",
    PARSING: "parseing",
    PARSED: "parsed",
    APPENDING: "appending",
    BUFFER_FLUSHING: "buffer_fulling"
}


const HLStreamOptions = {
    liveMaxLatencyDurationCount:Infinity, //直播延迟
    liveSyncDurationCount:3, //直播同步
    maxMaxBufferLength:600,//最多缓冲600s
}

class HLStream extends AbstractStream{
	constructor( option ){
		super( option );
        this.option = Object.assign( Object.assign({}, HLStreamOptions), option );

        if (this.option.liveMaxLatencyDurationCount !== undefined && this.option.liveMaxLatencyDurationCount <= this.option.liveSyncDurationCount) {
            throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be gt "liveSyncDurationCount"');
        }


		this._state = STATE.IDLE;
		this._levels = [];
        this._level = 0;

		this.fragPrevious = null;
		this.fragCurrent  = null;
		this.demuxer = new Demuxer( this );

        this.evtOnVideoEvent = this.onVideoEvent.bind(this)
        this.evtOnDemuxEvent = this.onDemuxEvent.bind(this);
        this.evtOnMediaEvent = this.onMediaEvent.bind(this);
        this.evtOnMediaSourceEvent = this.onMediaSourceEvent.bind( this );
        this.evtOnSourceBufferEvent = this.onSourceBufferEvent.bind( this );

        this.sourceBuffer = null; //分为video和audio两个buffer
        //缓冲数据
        this.bufferRange = [];
        /**
         * video
         * @member 
         */
        this.media = null;  
        this.mediaSource = null;
        //mp4碎片流
        this.mp4segments = [];

        this.attachEvent();
	}


    attachVideo(video){
        this.media = video;
        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );
    }

    detachEvent(){
        this.off( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );
        this.off( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.off( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );        
        this.off( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }
    attachEvent(){

        this.on( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );
        
        this.on( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }

    onVideoEvent( evt ){
        console.log("videoevent:", evt.type)
        switch( evt.type ){
            case 'seeking':
                if (this.state === STATE.FRAG_LOADING) {
                    // check if currently loaded fragment is inside buffer.
                    //if outside, cancel fragment loading, otherwise do nothing
                    if (this.bufferInfo(this.media.currentTime, 0.3).len === 0) {
                        window.debug && console.log('seeking outside of buffer while fragment load in progress, cancel fragment load');
                        var fragCurrent = this.fragCurrent;
                        if (fragCurrent) {
                            try{
                                if (fragCurrent.loader) {
                                    fragCurrent.loader.abort();
                                }
                            }catch(e){}                            
                            this.fragCurrent = null;
                        }
                        this.fragPrevious = null;
                        // switch to IDLE state to load new fragment
                        this._state = STATE.IDLE;
                    }
                }
                if (this.media) {
                    this.lastCurrentTime = this.media.currentTime;
                }
                // avoid reporting fragment loop loading error in case user is seeking several times on same position
                if (this.fragLoadIdx !== undefined) {
                    //this.config.fragLoadingLoopThreshold=3
                    //this.fragLoadIdx += 2 * this.config.fragLoadingLoopThreshold;
                }
                // tick to speed up processing
                this.tick();
            case 'seeked':
                this.tick();
                break;
            case 'loadedmetadata':
                if (this.media.currentTime !== this.startPosition) {
                    this.media.currentTime = this.startPosition;
                }
                this.loadedmetadata = true;
                this.tick();
                break;
        }
    }

    onSourceBufferEvent( evt ){
        switch(evt.type){
            case "updateend":
                //流更新后，发现无可用字节
                console.log("updateend  mp4segments.length", this.mp4segments.length)
                if (this.state === STATE.APPENDING && this.mp4segments.length === 0) {
                    var frag = this.fragCurrent,
                    stats = this.stats;
                    if (frag) {
                        this.fragPrevious = frag;
                        /*
                        stats.tbuffered = performance.now();
                        this.fragLastKbps = Math.round(8 * stats.length / (stats.tbuffered - stats.tfirst));
                        this.hls.trigger(_events2['default'].FRAG_BUFFERED, {
                            stats: stats,
                            frag: frag
                        });
                        
                        */
                       // console.log('media buffered : ' + this.timeRangesToString(this.media.buffered));
                        console.log("updateend...........")
                        this._state = STATE.IDLE;
                    }
                }
                console.timeEnd("TIME[sourcebuffer]");
                this.tick();
                break;
            case "error":
                break;
        }
    }
    onMediaSourceEvent( evt ){
        switch( evt.type ){
            case 'sourceopen':
                this.trigger( MediaEvent.MEDIA_ATTACHED );
                let media = this.media;
                media.addEventListener('seeking', this.evtOnVideoEvent );
                media.addEventListener('seeked', this.evtOnVideoEvent );
                media.addEventListener('loadedmetadata', this.evtOnVideoEvent);
                media.addEventListener('ended', this.evtOnVideoEvent );
                

                this.startLoad();
                //debug
                console.log("#########source open");
                //this.play();
                // once received, don't listen anymore to sourceopen event
                this.mediaSource.removeEventListener('sourceopen', this.evtOnMediaSourceEvent );

                break;
            case 'sourceended':
                break;
            case 'sourceclose':
                break;
        }
    }
    //video attached
    onMediaEvent( evt, data ){
        console.log("onMediaEvent", data)
        switch( evt.type ){
            case MediaEvent.MEDIA_ATTACHING:
                let media = data.media;
                // setup the media source
                var ms = this.mediaSource = new MediaSource();
                //Media Source listeners
                ms.addEventListener('sourceopen', this.evtOnMediaSourceEvent);
                ms.addEventListener('sourceended', this.evtOnMediaSourceEvent);
                ms.addEventListener('sourceclose', this.evtOnMediaSourceEvent);
                // link video and media Source
                media.src = URL.createObjectURL(ms);
                break;
        }
    }

    onDemuxEvent(  evt, data ){
        //console.log("onDemuxEvent", evt.type, data)
        switch( evt.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
                if( this.state == STATE.PARSING ){
                    var audioCodec = this._levels[this._level].audioCodec,
                        videoCodec = this._levels[this._level].videoCodec,
                        sb;//sourcebuffer
                     // if playlist does not specify codecs, use codecs found while parsing fragment
                    // if no codec found while parsing fragment, also set codec to undefined to avoid creating sourceBuffer
                    if (audioCodec === undefined || data.audioCodec === undefined) {
                        audioCodec = data.audioCodec;
                    }

                    if (videoCodec === undefined || data.videoCodec === undefined) {
                        videoCodec = data.videoCodec;
                    }
                    // in case several audio codecs might be used, force HE-AAC for audio (some browsers don't support audio codec switch)
                    //don't do it for mono streams ...
                    var ua = navigator.userAgent.toLowerCase();
                    if (this.audiocodecswitch && data.audioChannelCount !== 1 && ua.indexOf('android') === -1 && ua.indexOf('firefox') === -1) {
                        audioCodec = 'mp4a.40.5';
                    }
                    console.log("videoCodec", videoCodec, "auduoCodes", audioCodec);
                    if (!this.sourceBuffer) {
                        this.sourceBuffer = {};
                        console.log('selected A/V codecs for sourceBuffers:' + audioCodec + ',' + videoCodec);
                        // create source Buffer and link them to MediaSource
                        console.log("### bind source Event.");
                        if (audioCodec) {
                            sb = this.sourceBuffer.audio = this.mediaSource.addSourceBuffer('video/mp4;codecs=' + audioCodec);
                            sb.addEventListener('updateend', this.evtOnSourceBufferEvent );
                            sb.addEventListener('error', this.evtOnSourceBufferEvent );
                        }
                        if (videoCodec) {
                            sb = this.sourceBuffer.video = this.mediaSource.addSourceBuffer('video/mp4;codecs=' + videoCodec);
                            sb.addEventListener('updateend', this.evtOnSourceBufferEvent);
                            sb.addEventListener('error', this.evtOnSourceBufferEvent );
                        }
                    }
                    if (audioCodec) {
                        this.mp4segments.push({
                            type: 'audio',
                            data: data.audioMoov
                        });
                    }
                    if (videoCodec) {
                        this.mp4segments.push({
                            type: 'video',
                            data: data.videoMoov
                        });
                    }
                    //trigger handler right now
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSING_DATA:
                if( this.state == STATE.PARSING ){
                    var level = this._levels[this._level],
                        frag = this.fragCurrent;
                    var drift = this.updateFragPTS( level.details, frag.sn, data.startPTS, data.endPTS );

                    /*　没啥用 
                    self.trigger(_events2['default'].LEVEL_PTS_UPDATED, {
                        details: level.details,
                        level: self.level,
                        drift: drift
                    });
                    */

                    this.mp4segments.push({
                        type: data.type,
                        data: data.moof
                    });
                    this.mp4segments.push({
                        type: data.type,
                        data: data.mdat
                    });

                    this.bufferRange.push({
                        type: data.type,
                        start: data.startPTS,
                        end: data.endPTS,
                        frag: frag
                    });
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSED:
                if (this._state === STATE.PARSING) {
                    this._state = STATE.PARSED;
                    //trigger handler right now
                    this.tick();
                }
                break;
        }
    }
	
    startLoad(){
        if (this.levels && this.media) {
            this.state = STATE.IDLE;
            var self = this;
            clearInterval( tickIntervalId );
            tickIntervalId = setInterval( function(){
                self.tick();
            }, 1000 );
            this.tick();
        } else {
           window.debug && console.warn('cannot start loading as either manifest not parsed or video not attached');
        }
    }


	async load(){
        request.cancel();
        
		console.log("HLStream.load", this.option.url )
		let content =  await request.get( this.option.url );
		let m3u8data = new M3U8Parser().parse( content , this.option.url );

        //过滤数据
        var levels0 = [],
            levels = [],
            bitrateStart,
            i,
            bitrateSet = {},
            videoCodecFound = false,
            audioCodecFound = false;
        // regroup redundant level together
        m3u8data.levels.forEach(function(level) {
            if (level.videoCodec) {
                videoCodecFound = true;
            }
            if (level.audioCodec) {
                audioCodecFound = true;
            }
            var redundantLevelId = bitrateSet[level.bitrate];
            if (redundantLevelId === undefined) {
                bitrateSet[level.bitrate] = levels0.length;
                level.url = [level.url];
                level.urlId = 0; //一个码率如果有多个m3u8，默认取第0个
                levels0.push(level);
            } else {
                levels0[redundantLevelId].url.push(level.url);
            }
        });
        // remove audio-only level if we also have levels with audio+video codecs signalled
        if (videoCodecFound && audioCodecFound) {
            levels0.forEach(function(level) {
                if (level.videoCodec) {
                    levels.push(level);
                }
            });
        } else {
            levels = levels0;
        }

        // only keep level with supported audio/video codecs
        levels = levels.filter(function(level) {
            var checkSupported = function checkSupported(codec) {
                return MediaSource.isTypeSupported('video/mp4;codecs=' + codec);
            };
            var audioCodec = level.audioCodec,
            videoCodec = level.videoCodec;

            return (!audioCodec || checkSupported(audioCodec)) && (!videoCodec || checkSupported(videoCodec));
        });
        this._levels = levels;

		console.log("_levels", this._levels)
		this._state = STATE.IDLE;
		this.tick();
	}

	async loadFrag( frag ){
        console.time("[TIME]loadfrag");
        this._state = STATE.FRAG_LOADING;
		let data = await request.get( frag.url, {responseType: 'arraybuffer','method':'get'} );
        console.timeEnd("[TIME]loadfrag");
		var uint8 = new Uint8Array( data );
		//console.log(data)
		console.log("uint8",uint8)
        var fragCurrent = this.fragCurrent;
        //开始解码TS
        this._state = STATE.PARSING;
        var currentLevel = this._levels[this._level],
            details = currentLevel.details,
            duration = details.totalduration,
            start = fragCurrent.start,
            level = fragCurrent.level,
            sn = fragCurrent.sn,
            audioCodec = currentLevel.audioCodec,
            videoCodec = currentLevel.videoCodec;
        console.log("details",details, currentLevel)
        var uint8 = new Uint8Array( data );
        this.push( uint8, audioCodec, videoCodec, start, this.fragCurrent.cc , level, sn, duration , this.fragCurrent.decryptdata );
		
	}


	async play(){
		if( this._state == STATE.IDLE ){
			this.load();
		}
	}
    
    /**
	*	@method push
	*	@param data:uint8array
	*	@param 
	*/
	push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration, decryptdata) {
		if( typeof timeOffset == "undefined") timeOffset = 0;
		if( typeof cc == "undefined") cc = 0;
		if( typeof level == "undefined") level = 0;
		if( typeof sn == "undefined") sn = 0;
		if( typeof duration == "undefined") duration = 0;
		if( typeof decryptdata == "undefined"){
			decryptdata = {
				iv: null,
				key: null,
				method: null,
				uri: null
			}
		}
        console.log("Demux Data...");
		this.demuxer.push( data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration, decryptdata );
	}

	tick(){
        console.log("state...", this._state)
		switch( this._state ){
			case STATE.IDLE:
				if( !this.media ) return;
                // determine next candidate fragment to be loaded, based on current position and
                //  end of buffer position
                //  ensure 60s of buffer upfront
                // if we have not yet loaded any fragment, start loading from start position
                let pos = 0;
                if (this.loadedmetadata) {
                    pos = this.media.currentTime;
                } else {
                    pos = this.nextLoadPosition || 0;
                }
                /*
                // determine next load level
                if (this.startFragmentRequested === false) {
                    level = this.startLevel;
                } else {
                    // we are not at playback start, get next load level from level Controller
                    level = hls.nextLoadLevel;
                }
                */


                if( !this.startPosition ) this.startPosition = 0;
                var bufferInfo = this.bufferInfo(pos, 0.3),
                    bufferLen = bufferInfo.len,
                    bufferEnd = bufferInfo.end,
                    fragPrevious = this.fragPrevious,
                    maxBufLen;
                var level = this._level;//暂只处理单码率
                console.log("level", level)
                // compute max Buffer Length that we could get from this load level, based on level bitrate. don't buffer more than 60 MB and more than 30s
                if (this._levels[level].hasOwnProperty('bitrate')) {
                    maxBufLen = Math.max(8 * this.option.maxBufferSize / this.levels[level].bitrate, this.option.maxBufferLength);
                    maxBufLen = Math.min(maxBufLen, this.option.maxMaxBufferLength);
                } else {
                    this.option.maxBufferLength = 30;//30秒
                    maxBufLen = this.option.maxBufferLength;
                }
                let levelDetails = this._levels[level].details;;
                if (bufferLen < maxBufLen ) {
                    
                    if( typeof levelDetails == 'undefined'){
                        //等待码率切换
                        return;
                    }
                    var fragments = levelDetails.fragments,
                    fragLen = fragments.length,
                    start = fragments[0].start,
                    end = fragments[fragLen - 1].start + fragments[fragLen - 1].duration;
                    console.log("fragLen", fragLen, start, end)
                    var _frag = undefined;

                    if (!_frag) {
                        var foundFrag;
                        if (bufferEnd < end) {
                            foundFrag = BinarySearch.search(fragments,
                            function(candidate) {
                                //logger.log(`level/sn/start/end/bufEnd:${level}/${candidate.sn}/${candidate.start}/${(candidate.start+candidate.duration)}/${bufferEnd}`);
                                // offset should be within fragment boundary
                                if (candidate.start + candidate.duration <= bufferEnd) {
                                    return 1;
                                } else if (candidate.start > bufferEnd) {
                                    return - 1;
                                }
                                return 0;
                            });
                        }else{
                            foundFrag = fragments[fragLen - 1];// reach end of playlist
                        }
                        if( foundFrag ){
                            _frag = foundFrag;
                            start = foundFrag.start;
                            //logger.log('find SN matching with pos:' +  bufferEnd + ':' + frag.sn);
                            if (fragPrevious && _frag.level === fragPrevious.level && _frag.sn === fragPrevious.sn) {
                                if (_frag.sn < levelDetails.endSN) {
                                    _frag = fragments[_frag.sn + 1 - levelDetails.startSN];
                                    //拖到上一段未，prev和cur的idx一致
                                    window.debug && console.log('SN just loaded, load next one: ' + _frag.sn);
                                }else{
                                    if (!levelDetails.live) {
                                        var mediaSource = this.mediaSource;
                                        var state = mediaSource.readyState;
                                        console.log("----------source state", state);
                                        if (mediaSource && mediaSource.readyState === 'open') {
                                            // ensure sourceBuffer are not in updating states
                                            var sb = this.sourceBuffer;
                                            if (! (sb.audio && sb.audio.updating || sb.video && sb.video.updating)) {
                                                console.log('all media data available, signal endOfStream() to MediaSource');
                                                //Notify the media element that it now has all of the media data
                                                mediaSource.endOfStream();
                                            }
                                        }
                                    }
                                    _frag = null; //?看不懂
                                }
                            }
                        }

                        if( _frag ){
                            if (_frag.decryptdata.uri != null && _frag.decryptdata.key == null) {
                                //TODO,有加密段
                            }else{
                                this.fragCurrent = _frag;
                                this.startFragmentRequested = true;
                                this.loadFrag( _frag );
                            }
                        }
                    }
                }


				
				break;
            case STATE.PARSING:
                //等待状态变为parsed
                break;
            case STATE.PARSED:
            case STATE.APPENDING:
                console.log("appendBuffer....")
                if( this.sourceBuffer ){
                    if (this.media.error) {
                        console.error('trying to append although a media error occured, switch to ERROR state');
                        //this.state = STATE.ERROR;
                        return;
                    }
                    // if MP4 segment appending in progress nothing to do
                    if (this.sourceBuffer.audio && this.sourceBuffer.audio.updating || this.sourceBuffer.video && this.sourceBuffer.video.updating) {
                    }else if( this.mp4segments.length ){
                        var segment = this.mp4segments.shift();
                        try {
                            //logger.log(`appending ${segment.type} SB, size:${segment.data.length});
                            console.time("TIME[sourcebuffer]");
                            console.log("segment:", segment);
                            console.log("segment", segment.data, "length=", segment.data.length);
                            this.sourceBuffer[segment.type].appendBuffer(segment.data);
                            this.appendError = 0;
                        } catch(err) {
                            // in case any error occured while appending, put back segment in mp4segments table
                            window.debug && console.error(`error while trying to append buffer:${err.message},try appending later`);
                            this.mp4segments.unshift(segment);
                            if (this.appendError) {
                                this.appendError++;
                            } else {
                                this.appendError = 1;
                            }
                            /*
                            var event = {
                                type: _errors.ErrorTypes.MEDIA_ERROR,
                                details: _errors.ErrorDetails.BUFFER_APPEND_ERROR,
                                frag: this.fragCurrent
                            };
                            /* with UHD content, we could get loop of quota exceeded error until
                            browser is able to evict some data from sourcebuffer. retrying help recovering this
                            */
                            /*
                            if (this.appendError > this.config.appendErrorMaxRetry) {
                                console.log('fail ' + this.config.appendErrorMaxRetry + ' times to append segment in sourceBuffer');
                                event.fatal = true;
                                hls.trigger(_events2['default'].ERROR, event);
                                this.state = STATE.ERROR;
                                return;
                            } else {
                                event.fatal = false;
                                hls.trigger(_events2['default'].ERROR, event);
                            }
                            */
                        }
                    }
                    this._state = STATE.APPENDING;
                }else{
                    this._state = STATE.IDLE;
                }
                break;

		}
	}


    bufferInfo(pos, maxHoleDuration) {
        var media = this.media,
            vbuffered = media.buffered,
            buffered = [],
            i;
        for (i = 0; i < vbuffered.length; i++) {
            buffered.push({
                start: vbuffered.start(i),
                end: vbuffered.end(i)
            });
        }
        return this.bufferedInfo(buffered, pos, maxHoleDuration);
    }

    bufferedInfo(buffered, pos, maxHoleDuration) {
        var buffered2 = [],
            // bufferStart and bufferEnd are buffer boundaries around current video position
            bufferLen,
            bufferStart,
            bufferEnd,
            bufferStartNext,
            i;
        // sort on buffer.start/smaller end (IE does not always return sorted buffered range)
        buffered.sort(function(a, b) {
            var diff = a.start - b.start;
            if (diff) {
                return diff;
            } else {
                return b.end - a.end;
            }
        });
        // there might be some small holes between buffer time range
        // consider that holes smaller than maxHoleDuration are irrelevant and build another
        // buffer time range representations that discards those holes
        for (i = 0; i < buffered.length; i++) {
            var buf2len = buffered2.length;
            if (buf2len) {
                var buf2end = buffered2[buf2len - 1].end;
                // if small hole (value between 0 or maxHoleDuration ) or overlapping (negative)
                if (buffered[i].start - buf2end < maxHoleDuration) {
                    // merge overlapping time ranges
                    // update lastRange.end only if smaller than item.end
                    // e.g.  [ 1, 15] with  [ 2,8] => [ 1,15] (no need to modify lastRange.end)
                    // whereas [ 1, 8] with  [ 2,15] => [ 1,15] ( lastRange should switch from [1,8] to [1,15])
                    if (buffered[i].end > buf2end) {
                        buffered2[buf2len - 1].end = buffered[i].end;
                    }
                } else {
                    // big hole
                    buffered2.push(buffered[i]);
                }
            } else {
                // first value
                buffered2.push(buffered[i]);
            }
        }
        for (i = 0, bufferLen = 0, bufferStart = bufferEnd = pos; i < buffered2.length; i++) {
            var start = buffered2[i].start,
            end = buffered2[i].end;
            //logger.log('buf start/end:' + buffered.start(i) + '/' + buffered.end(i));
            if (pos + maxHoleDuration >= start && pos < end) {
                // play position is inside this buffer TimeRange, retrieve end of buffer position and buffer length
                bufferStart = start;
                bufferEnd = end + maxHoleDuration;
                bufferLen = bufferEnd - pos;
            } else if (pos + maxHoleDuration < start) {
                bufferStartNext = start;
            }
        }
        return {
            len: bufferLen,
            start: bufferStart,
            end: bufferEnd,
            nextStart: bufferStartNext
        };
    }

    updateFragPTS(details, sn, startPTS, endPTS) {
        var fragIdx, fragments, frag, i;
        // exit if sn out of range
        if (sn < details.startSN || sn > details.endSN) {
            return 0;
        }
        fragIdx = sn - details.startSN;
        fragments = details.fragments;
        frag = fragments[fragIdx];
        if (!isNaN(frag.startPTS)) {
            startPTS = Math.max(startPTS, frag.startPTS);
            endPTS = Math.min(endPTS, frag.endPTS);
        }
        var drift = startPTS - frag.start;
        frag.start = frag.startPTS = startPTS;
        frag.endPTS = endPTS;
        frag.duration = endPTS - startPTS;
        // adjust fragment PTS/duration from seqnum-1 to frag 0
        for (i = fragIdx; i > 0; i--) {
            this.updatePTS(fragments, i, i - 1);
        }
        // adjust fragment PTS/duration from seqnum to last frag
        for (i = fragIdx; i < fragments.length - 1; i++) {
            this.updatePTS(fragments, i, i + 1);
        }
        details.PTSKnown = true;
        return drift;
    }

    updatePTS(fragments, fromIdx, toIdx) {
        var fragFrom = fragments[fromIdx],
        fragTo = fragments[toIdx],
        fragToPTS = fragTo.startPTS;
        // if we know startPTS[toIdx]
        if (!isNaN(fragToPTS)) {
            // update fragment duration.
            // it helps to fix drifts between playlist reported duration and fragment real duration
            if (toIdx > fromIdx) {
                fragFrom.duration = fragToPTS - fragFrom.start;
                if (fragFrom.duration < 0) {
                    _utilsLogger.logger.error('negative duration computed for ' + fragFrom + ', there should be some duration drift between playlist and fragment!');
                }
            } else {
                fragTo.duration = fragFrom.start - fragToPTS;
                if (fragTo.duration < 0) {
                    _utilsLogger.logger.error('negative duration computed for ' + fragTo + ', there should be some duration drift between playlist and fragment!');
                }
            }
        } else {
            // we dont know startPTS[toIdx]
            if (toIdx > fromIdx) {
                fragTo.start = fragFrom.start + fragFrom.duration;
            } else {
                fragTo.start = fragFrom.start - fragTo.duration;
            }
        }
    }


    get state(){
        return this._state;
    }

    destroy(){

    }
}
export {
	HLStream
}
export default HLStream;