import AbstractStream from './AbstractStream'
import request from '@/lib/request'
import M3U8Parser from '../parser/M3U8Parser';
import BinarySearch from "../BinarySearch"
import { HLSEvent, MediaEvent } from '../../event';

import { Demuxer } from './demux';
let axios = require('axios');

const STATE = {
    PEDDING:"pending",

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
    cross:true,
    liveMaxLatencyDurationCount:Infinity, //直播延迟
    liveSyncDurationCount:3, //直播同步
    maxMaxBufferLength:600,//最多缓冲600s
    maxBufferLength:30,//默认缓冲30s
    maxBufferSize:60 * 1000 * 1000
}

class HLStream extends AbstractStream{
	constructor( option ){
		super( option );
        this.option = Object.assign( Object.assign({}, HLStreamOptions), option );

        if (this.option.liveMaxLatencyDurationCount !== undefined && this.option.liveMaxLatencyDurationCount <= this.option.liveSyncDurationCount) {
            throw new Error('Illegal hls.js config: "liveMaxLatencyDurationCount" must be gt "liveSyncDurationCount"');
        }


		this._state = STATE.PEDDING;
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

        this.evtOnBufferEvent = this.onBufferEvent.bind( this );

        this.sourceBuffer = {}; //分为video和audio两个buffer
        //缓冲数据
        this.bufferRange = [];
        this.pendingTracks = {}; //sourceBuffer未打开时的缓存tracks
        
        this.mediaSource = null;
        //mp4碎片流
        this.mp4segments = [];

        this.attachEvent();
	}


   

    detachEvent(){
        this.off( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );

        this.off( HLSEvent.FRAG_PARSING, this.evtOnDemuxEvent );
        this.off( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.off( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );        
        this.off( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }
    attachEvent(){

        this.on( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );
        
        this.on( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
        this.on( HLSEvent.BUFFER_CODECS, this.evtOnBufferEvent )
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
                console.log("视频时长:", this.media.duration)
                this.loadedmetadata = true;
                //this.tick();
                break;
            case 'timeupdate':
                let pos = this.media.currentTime;
                var bufferInfo = this.bufferInfo(pos, 0.3),
                    bufferLen = bufferInfo.len,
                    bufferEnd = bufferInfo.end,
                    fragPrevious = this.fragPrevious,
                    maxBufLen;
                var level = this._level;//暂只处理单码率
                
                // compute max Buffer Length that we could get from this load level, based on level bitrate. don't buffer more than 60 MB and more than 30s
                if (this._levels[level].hasOwnProperty('bitrate')) {
                    maxBufLen = Math.max(8 * this.option.maxBufferSize / this._levels[level].bitrate, this.option.maxBufferLength);
                    maxBufLen = Math.min(maxBufLen, this.option.maxMaxBufferLength);
                } else {
                    maxBufLen = this.option.maxBufferLength;
                }
                let levelDetails = this._levels[level].details;
                if( bufferLen < maxBufLen && this._state == STATE.IDLE  ){
                    this._state = STATE.IDLE;
                    this.tick();
                }
                //console.log("BufferLength", bufferLen, bufferEnd, maxBufLen)
                //console.log("bufferRange", this.getBufferedRange())
                break;
        }
    }

    onBufferEvent( evt, data ){
        switch( evt.type ){
            case HLSEvent.BUFFER_CODECS:
                let tracks = data;
                // if source buffer(s) not created yet, appended buffer tracks in this.pendingTracks
                // if sourcebuffers already created, do nothing ...
                if (Object.keys(this.sourceBuffer).length === 0) {
                  for (let trackName in tracks) this.pendingTracks[trackName] = tracks[trackName];
                  let mediaSource = this.mediaSource;
                  if (mediaSource && mediaSource.readyState === 'open') {
                    // try to create sourcebuffers if mediasource opened
                    this.checkPendingTracks();
                  }
                }
                break;
        }
    }

    onSourceBufferEvent( evt ){
        console.log("onSourceBufferEvent:", evt.type)
        switch(evt.type){
            case "updateend":
                //流更新后，发现无可用字节                
                this.appending = false;
                this.doAppending();
                this.onSBUpdateEnd();
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
                media.addEventListener('timeupdate', this.evtOnVideoEvent );

                this.startLoad();
                //debug
                console.log("#########source open");
                //this.play();
                // once received, don't listen anymore to sourceopen event
                this.mediaSource.removeEventListener('sourceopen', this.evtOnMediaSourceEvent );
                this.play();
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
        let self = this;
        switch( evt.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
                var fragCurrent = this.fragCurrent;
                const fragNew = data.frag;
                data.id = 'main';//设置个id 干什么，多线程标识么
                if (fragCurrent &&
                data.id === 'main' &&
                fragNew.sn === fragCurrent.sn &&
                fragNew.level === fragCurrent.level &&
                this.state === STATE.PARSING) {
                    let tracks = data.tracks, trackName, track;

                    // if audio track is expected to come from audio stream controller, discard any coming from main
                    if (tracks.audio && this.altAudio) {
                        delete tracks.audio;
                    }

                    // include levelCodec in audio and video tracks
                    track = tracks.audio;
                    if (track) {
                        let audioCodec = this._levels[this._level].audioCodec,
                        ua = navigator.userAgent.toLowerCase();
                        if (audioCodec && this.audioCodecSwap) {
                            window.debug && console.log('swapping playlist audio codec');
                            if (audioCodec.indexOf('mp4a.40.5') !== -1) {
                                audioCodec = 'mp4a.40.2';
                            } else {
                                audioCodec = 'mp4a.40.5';
                            }
                        }
                        // in case AAC and HE-AAC audio codecs are signalled in manifest
                        // force HE-AAC , as it seems that most browsers prefers that way,
                        // except for mono streams OR on FF
                        // these conditions might need to be reviewed ...
                        if (this.audioCodecSwitch) {
                            // don't force HE-AAC if mono stream
                            if (track.metadata.channelCount !== 1 &&
                                // don't force HE-AAC if firefox
                                ua.indexOf('firefox') === -1) {
                                audioCodec = 'mp4a.40.5';
                            }
                        }
                        // HE-AAC is broken on Android, always signal audio codec as AAC even if variant manifest states otherwise
                        if (ua.indexOf('android') !== -1 && track.container !== 'audio/mpeg') { // Exclude mpeg audio
                            audioCodec = 'mp4a.40.2';
                        }
                        track.levelCodec = audioCodec;
                        track.id = data.id;
                    }
                    track = tracks.video;
                    if (track) {
                        track.levelCodec = this._levels[this._level].videoCodec;
                        track.id = data.id;
                    }
                    this.trigger( HLSEvent.BUFFER_CODECS, tracks )
                    // loop through tracks that are going to be provided to bufferController
                    for (trackName in tracks) {
                        track = tracks[trackName];
                        window.debug && console.log(`main track:${trackName},container:${track.container},codecs[level/parsed]=[${track.levelCodec}/${track.codec}]`);
                        let initSegment = track.initSegment;
                        if (initSegment) {
                            this.appended = true;
                            // arm pending Buffering flag before appending a segment
                            this.pendingBuffering = true;
                            this.pushTrack( { type: trackName, data: initSegment, parent: 'main', content: 'initSegment' } )
                        }
                    }
                    // trigger handler right now
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSING:
                //由Demuxer主动触发
                this._state =  STATE.PARSING;
                break;
            case HLSEvent.FRAG_PARSING_DATA:
                var fragCurrent = this.fragCurrent;
                var fragNew = data.frag;
                data.id = 'main';
                if (fragCurrent && data.id === 'main' && fragNew.sn === fragCurrent.sn && fragNew.level === fragCurrent.level && !(data.type === 'audio' && this.altAudio) && // filter out main audio if audio track is loaded through audio stream controller
                this._state === STATE.PARSING) {
                    var level = this._levels[this._level],
                        frag = fragCurrent;
                    if (isNaN(data.endPTS)) {
                        data.endPTS = data.startPTS + fragCurrent.duration;
                        data.endDTS = data.startDTS + fragCurrent.duration;
                    }

                    if (data.hasAudio === true) {
                        //TODO
                        //frag.addElementaryStream(loader_fragment.ElementaryStreamTypes.AUDIO);
                    }

                    if (data.hasVideo === true) {
                        //TODO
                        //frag.addElementaryStream(loader_fragment.ElementaryStreamTypes.VIDEO);
                    }

                    window.debug && console.log('Parsed ' + data.type + ',PTS:[' + data.startPTS.toFixed(3) + ',' + data.endPTS.toFixed(3) + '],DTS:[' + data.startDTS.toFixed(3) + '/' + data.endDTS.toFixed(3) + '],nb:' + data.nb + ',dropped:' + (data.dropped || 0));

                    // Detect gaps in a fragment  and try to fix it by finding a keyframe in the previous fragment (see _findFragments)
                    if (data.type === 'video') {
                        frag.dropped = data.dropped;
                        if (frag.dropped) {
                            if (!frag.backtracked) {
                                var levelDetails = level.details;
                                if (levelDetails && frag.sn === levelDetails.startSN) {
                                    window.debug && console["b" /* window.debug && console */].warn('missing video frame(s) on first frag, appending with gap', frag.sn);
                                } else {
                                    window.debug && console["b" /* window.debug && console */].warn('missing video frame(s), backtracking fragment', frag.sn);
                                    // Return back to the IDLE state without appending to buffer
                                    // Causes findFragments to backtrack a segment and find the keyframe
                                    // Audio fragments arriving before video sets the nextLoadPosition, causing _findFragments to skip the backtracked fragment
                                    this.fragmentTracker.removeFragment(frag);
                                    frag.backtracked = true;
                                    this.nextLoadPosition = data.startPTS;
                                    this._state = STATE.IDLE;
                                    this.fragPrevious = frag;
                                    this.tick();
                                    return;
                                }
                            } else {
                                window.debug && console["b" /* window.debug && console */].warn('Already backtracked on this fragment, appending with the gap', frag.sn);
                            }
                        } else {
                        // Only reset the backtracked flag if we've loaded the frag without any dropped frames
                            frag.backtracked = false;
                        }
                    }

                    /** TODO 
                    var drift = updateFragPTSDTS(level.details, frag, data.startPTS, data.endPTS, data.startDTS, data.endDTS),
                    hls = this.hls;
                    hls.trigger(events[].LEVEL_PTS_UPDATED, { details: level.details, level: this.level, drift: drift, type: data.type, start: data.startPTS, end: data.endPTS });
                    // has remuxer dropped video frames located before first keyframe ?
                    */
                    [data.data1, data.data2].forEach(function (buffer) {
                        // only append in PARSING state (rationale is that an appending error could happen synchronously on first segment appending)
                        // in that case it is useless to append following segments
                        if ( buffer && buffer.length && self.state === STATE.PARSING) {
                            self.appended = true;
                            // arm pending Buffering flag before appending a segment
                            self.pendingBuffering = true;
                            self.pushTrack( { type: data.type, data: buffer, parent: 'main', content: 'data' } )
                        }
                    });
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSED:
                var fragCurrent = this.fragCurrent;
                var fragNew = data.frag;
                data.id = 'main'
                if (fragCurrent &&
                    data.id === 'main' &&
                    fragNew.sn === fragCurrent.sn &&
                    fragNew.level === fragCurrent.level &&
                    this._state === STATE.PARSING) {
                  
                    this._state = STATE.PARSED;
                    this._checkAppendedParsed();
                    this.tick();
                }
                break;
        }
    }

    checkPendingTracks(){
        //pendingTracks只有在mediaSource未打开时才会创建
        // try to create sourcebuffers if mediasource opened
        // if any buffer codecs pending, check if we have enough to create sourceBuffers

        var pendingTracks = this.pendingTracks || {},
            pendingTracksNb = Object.keys(pendingTracks).length;
        // if any pending tracks and (if nb of pending tracks gt or equal than expected nb or if unknown expected nb)
        if (pendingTracksNb && (this.sourceBufferNb <= pendingTracksNb || this.sourceBufferNb === 0)) {
          // ok, let's create them now !
          this.createSourceBuffers(pendingTracks);
          this.pendingTracks = {};
          // append any pending segments now !
          this.doAppending();
        }
    }

    /**
     * @param {Object} track
     * { type: trackName, data: initSegment, parent: 'main', content: 'initSegment/data' }
     */
    pushTrack( track ){
        if (!this._needsFlush) {
            if (!this.segments) {
                this.segments = [ track ];
            } else {
                this.segments.push( track );
            }
            this.doAppending();
        }
    }


    /** 检测append的数据是否解析完 */
    _checkAppendedParsed(){
        // trigger handler right now
        if (this._state === STATE.PARSED && (!this.appended || !this.pendingBuffering)) {
            const frag = this.fragCurrent;
            if (frag) {
                const media = this.mediaBuffer ? this.mediaBuffer : this.media;                
                this.fragPrevious = frag;
                const stats = this.stats;
                //stats.tbuffered = window.performance.now();
                // we should get rid of this.fragLastKbps
                //this.fragLastKbps = Math.round(8 * stats.total / (stats.tbuffered - stats.tfirst));
                //this.hls.trigger(Event.FRAG_BUFFERED, { stats: stats, frag: frag, id: 'main' });
                this._state = STATE.IDLE;
            }
            this.tick();

        }
    }

    _checkBufferEmpty(){

    }

    doAppending(){
        let hls = this.hls, sourceBuffer = this.sourceBuffer, segments = this.segments;
        if (Object.keys(sourceBuffer).length) {
            if (this.media.error) {
                this.segments = [];
                window.debug && console.error('trying to append although a media error occured, flush segment and abort');
                return;
            }
            if (this.appending) {
                // window.debug && console.log(`sb appending in progress`);
                return;
            }
            if (segments && segments.length) {
                let segment = segments.shift();
                try {
                    let type = segment.type, sb = sourceBuffer[type];
                    if (sb) {
                        if (!sb.updating) {
                            // reset sourceBuffer ended flag before appending segment
                            sb.ended = false;
                            // window.debug && console.log(`appending ${segment.content} ${type} SB, size:${segment.data.length}, ${segment.parent}`);
                            this.parent = segment.parent;
                            console.log("appendBuffer:", segment)
                            sb.appendBuffer(segment.data);
                            this.appendError = 0;
                            this.appended++;
                            this.appending = true;
                        } else {
                            segments.unshift(segment);
                        }
                    } else {
                        // in case we don't have any source buffer matching with this segment type,
                        // it means that Mediasource fails to create sourcebuffer
                        // discard this segment, and trigger update end
                        this.onSBUpdateEnd();
                    }
                } catch (err) {
                    // in case any error occured while appending, put back segment in segments table
                    window.debug && console.error(`error while trying to append buffer:${err.message}`);
                    segments.unshift(segment);
                    let event = { type: ErrorTypes.MEDIA_ERROR, parent: segment.parent };
                    if (err.code !== 22) {
                    if (this.appendError) {
                    this.appendError++;
                    } else {
                    this.appendError = 1;
                    }

                    event.details = ErrorDetails.BUFFER_APPEND_ERROR;
                    /* with UHD content, we could get loop of quota exceeded error until
                    browser is able to evict some data from sourcebuffer. retrying help recovering this
                    */
                    if (this.appendError > hls.config.appendErrorMaxRetry) {
                            window.debug && console.log(`fail ${hls.config.appendErrorMaxRetry} times to append segment in sourceBuffer`);
                            segments = [];
                            event.fatal = true;
                            hls.trigger(Event.ERROR, event);
                        } else {
                            event.fatal = false;
                            hls.trigger(Event.ERROR, event);
                        }
                    } else {
                        // QuotaExceededError: http://www.w3.org/TR/html5/infrastructure.html#quotaexceedederror
                        // let's stop appending any segments, and report BUFFER_FULL_ERROR error
                        this.segments = [];
                        event.details = ErrorDetails.BUFFER_FULL_ERROR;
                        event.fatal = false;
                        hls.trigger(Event.ERROR, event);
                    }
                }
            }else{
                
                
            }
        }
    }

    onSBUpdateEnd(){
        this.appending = false;
        let parent = this.parent;
        // count nb of pending segments waiting for appending on this sourcebuffer
        //正和处理的segements数据
        let pending = this.segments.reduce((counter, segment) => (segment.parent === parent) ? counter + 1 : counter, 0);
        this.pendingBuffering = pending > 0;
        this._checkAppendedParsed();
        this.doAppending();
    }

    
    createSourceBuffers( tracks ){
        let sourceBuffer = this.sourceBuffer, 
            mediaSource = this.mediaSource;

        for (let trackName in tracks) {
          if (!sourceBuffer[trackName]) {
            let track = tracks[trackName];
            // use levelCodec as first priority
            let codec = track.levelCodec || track.codec;
            let mimeType = `${track.container};codecs=${codec}`;
            window.debug && console.log(`creating sourceBuffer(${mimeType})`);
            try {
              let sb = sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
              console.log("bind source event")
              sb.addEventListener('updateend', this.evtOnSourceBufferEvent);
              sb.addEventListener('error', this.evtOnSourceBufferEvent);
              //this.tracks[trackName] = { codec: codec, container: track.container };
              track.buffer = sb;
            } catch (err) {
                alert('error=='+ err);
              window.debug && console.error(`error while trying to add sourceBuffer:${err.message}`);
              //this.hls.trigger(Event.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.BUFFER_ADD_CODEC_ERROR, fatal: false, err: err, mimeType: mimeType });
            }
          }
        }
        //this.hls.trigger(Event.BUFFER_CREATED, { tracks: tracks });
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

	async load( url, level = undefined ){
        if( !this.option.cross ){
            url = 'http://web.fun.tv/proxy.php?url=' + encodeURIComponent( url );
        }
        //request.cancel();
        let isLevel = typeof level != 'undefined'
		console.log("HLStream.load", this.option.url )
		let { data } =  await request.get( url );        
		let m3u8data = new M3U8Parser().parse( data , this.option.url );
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
                try{
                    return MediaSource.isTypeSupported('video/mp4;codecs=' + codec);
                }catch(e){

                }
                return false;
            };
            var audioCodec = level.audioCodec,
            videoCodec = level.videoCodec;

            return (!audioCodec || checkSupported(audioCodec)) && (!videoCodec || checkSupported(videoCodec));
        });
        if( isLevel ){
            this._levels[ level ].details = levels[0].details;
        }else{
            this._levels = levels;
        }
        

        /*

        var audioExpected = data.audio,
        videoExpected = data.video || data.levels.length && data.altAudio,
        sourceBufferNb = 0;
        // in case of alt audio 2 BUFFER_CODECS events will be triggered, one per stream controller
        // sourcebuffers will be created all at once when the expected nb of tracks will be reached
        // in case alt audio is not used, only one BUFFER_CODEC event will be fired from main stream controller
        // it will contain the expected nb of source buffers, no need to compute it
        if (data.altAudio && (audioExpected || videoExpected)) {
          sourceBufferNb = (audioExpected ? 1 : 0) + (videoExpected ? 1 : 0);  
        }
        */
        this.sourceBufferNb = 0;


		console.log("_levels", this._levels)
		this._state = STATE.IDLE;
		this.tick();
	}

	async loadFrag( frag ){
        console.time("[TIME]loadfrag");
        this._state = STATE.FRAG_LOADING;
        request.cancel();
        if( !this.option.cross ){
            if( !/proxy/.exec(frag.url)){
                frag.url = 'http://web.fun.tv/proxy.php?url=' + encodeURIComponent( frag.url );
            }
        }
        let url = frag.url;
		let { data } = await request.get( url, {responseType: 'arraybuffer','method':'get'} );
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
        let mediaSeeking = this.media && this.media.seeking;
        /** 是否精准*/
        let accurateTimeOffset = !mediaSeeking && (details.PTSKnown || !details.live);
        if( fragCurrent.sn == 'initSegment' ){
            details.initSegment.data = uint8;
            this._state = STATE.IDLE;
            this.tick();
        }else{
            //push (data, initSegment, audioCodec, videoCodec, frag, duration, accurateTimeOffset, defaultInitPTS) {
            let initSegmentData = details.initSegment ? details.initSegment.data : [];
            this.demuxer.push( uint8, initSegmentData, audioCodec, videoCodec, fragCurrent, duration, accurateTimeOffset, undefined );
            //this.push( uint8, audioCodec, videoCodec, start, this.fragCurrent.cc , level, sn, duration , this.fragCurrent.decryptdata );
        }
        
		
	}


	async play(){
		if( this._state == STATE.PEDDING ){
			this.load( this.option.url ).then(res=>{
                super.play();
            })
		}else{
            super.play();
            //this.media.play();
        }
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
                
                // compute max Buffer Length that we could get from this load level, based on level bitrate. don't buffer more than 60 MB and more than 30s
                if (this._levels[level].hasOwnProperty('bitrate')) {
                    maxBufLen = Math.max(8 * this.option.maxBufferSize / this._levels[level].bitrate, this.option.maxBufferLength);
                    maxBufLen = Math.min(maxBufLen, this.option.maxMaxBufferLength);
                } else {
                    maxBufLen = this.option.maxBufferLength;
                }
                let levelDetails = this._levels[level].details;
                console.log("level", level, "bufferLen", bufferLen, "maxBufLen", maxBufLen)
                if( !levelDetails ){
                    this._state = STATE.WAITING_LEVEL;
                    this.load(this._levels[level].url, level );
                    return;
                }
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
                                //window.debug && console.log(`level/sn/start/end/bufEnd:${level}/${candidate.sn}/${candidate.start}/${(candidate.start+candidate.duration)}/${bufferEnd}`);
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
                        if( levelDetails.initSegment && !levelDetails.initSegment.data ){
                            //mp4初始frag
                            foundFrag = levelDetails.initSegment;
                        }
                        if( foundFrag ){
                            _frag = foundFrag;
                            start = foundFrag.start;
                            //window.debug && console.log('find SN matching with pos:' +  bufferEnd + ':' + frag.sn);
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
                            if ( _frag.decryptdata && _frag.decryptdata.uri != null && _frag.decryptdata.key == null) {
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
                console.log("appendBuffer....", this.segments)
                if( this.sourceBuffer ){
                    if (this.media.error) {
                        console.error('trying to append although a media error occured, switch to ERROR state');
                        //this.state = STATE.ERROR;
                        return;
                    }
                    // if MP4 segment appending in progress nothing to do
                    if (this.sourceBuffer.audio && this.sourceBuffer.audio.updating || this.sourceBuffer.video && this.sourceBuffer.video.updating) {
                        console.log("updating....")
                    }else if( this.mp4segments.length ){
                        var segment = this.mp4segments.shift();
                        try {
                            //window.debug && console.log(`appending ${segment.type} SB, size:${segment.data.length});
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
                    }else{
                        this._state = STATE.IDLE;
                        this.tick();
                    }
                    
                }
                break;

		}
	}

    getBufferedRange () {
        let range = [0, 0]
        let video = this.media;
        let buffered = video.buffered
        let currentTime = video.currentTime
        if (buffered) {
            for (let i = 0, len = buffered.length; i < len; i++) {
                range[0] = buffered.start(i)
                range[1] = buffered.end(i)
                if (range[0] <= currentTime && currentTime <= range[1]) {
                    break
                }
            }
        }       
        if (range[0] - currentTime <= 0 && currentTime - range[1] <= 0) {
            return range
        } else {
            return [0, 0]
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
            //window.debug && console.log('buf start/end:' + buffered.start(i) + '/' + buffered.end(i));
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
                    _utilswindow.debug && console.window.debug && console.error('negative duration computed for ' + fragFrom + ', there should be some duration drift between playlist and fragment!');
                }
            } else {
                fragTo.duration = fragFrom.start - fragToPTS;
                if (fragTo.duration < 0) {
                    _utilswindow.debug && console.window.debug && console.error('negative duration computed for ' + fragTo + ', there should be some duration drift between playlist and fragment!');
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

    get paused(){
        
    }


    

    destroy(){

    }
}
export {
	HLStream
}
export default HLStream;