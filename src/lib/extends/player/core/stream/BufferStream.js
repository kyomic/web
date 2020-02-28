import AbstractStream from './AbstractStream'
import { HLSEvent, MediaEvent } from '../../event';
import { Demuxer } from './demux';
import { Loader } from '@/lib/loader'


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


class BufferStream extends AbstractStream{
	constructor( provider ){
		super( provider );
        this.provider = provider;
        this._state = STATE.PEDDING;
        this.evtOnProiderEvent = this.onProviderEvent.bind( this );
		this.reset();
        this.demuxer = new Demuxer( this );

        this.sourceBufferNb = 0;
        this.sourceBuffer = {}; //分为video和audio两个buffer
        this.pendingTracks = {}; //sourceBuffer未打开时的缓存tracks
    }

    onProviderEvent(evt, data){
        console.log("provider evt", evt, data)
        switch( evt.type ){
            case 'load':
                this._levels = [

                ]
                break
            case 'append':
                       
                break;
        }
    }

    reset(){
        this._levels = undefined;
        this._level = 0;

        this.sourceBuffer = {}; //分为video和audio两个buffer	

        this.media = null;  
        this.mediaSource = null;
        //mp4碎片流
        this.segments = undefined;


        this.evtOnVideoEvent = this.onVideoEvent.bind(this)
        this.evtOnDemuxEvent = this.onDemuxEvent.bind(this);

        this.evtOnMediaEvent = this.onMediaEvent.bind(this);
        this.evtOnMediaSourceEvent = this.onMediaSourceEvent.bind( this );
        this.evtOnSourceBufferEvent = this.onSourceBufferEvent.bind( this );

        this.evtOnBufferEvent = this.onBufferEvent.bind( this );


        this.attachEvent();
    }

    attachVideo(video){
        this.media = video;
        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );


    }

    attachEvent(){
       
        this.loader = new Loader();
        console.log("loader", this.loader)
        this.loader.on('data', res=>{
            this.demuxer.push( res.data.chunk, [], '','', {
                cc:0,
            } )
        })


        this.on( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );

        this.on( HLSEvent.BUFFER_CODECS, this.evtOnBufferEvent )

        this.on( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }

    onVideoEvent( evt ){
        console.log("videoevent:", evt.type)
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
    onDemuxEvent(  evt, data ){
        //console.log("onDemuxEvent", evt.type, data)
        let self = this;
        switch( evt.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
                var fragCurrent = this.fragCurrent;
                const fragNew = data.frag;
                if ( true ) {
                    let tracks = data.tracks, trackName, track;
                    // if audio track is expected to come from audio stream controller, discard any coming from main
                    if (tracks.audio && this.altAudio) {
                        delete tracks.audio;
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
                if ( data.id === 'main'  && // filter out main audio if audio track is loaded through audio stream controller
                this._state === STATE.PARSING) {                   
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

                    

                    if( data ){
                        console.log("Parsed:", data.data1.byteLength, data.data2.byteLength)
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

    onSourceBufferEvent( evt ){
        switch(evt.type){
            case "updateend":
                //流更新后，发现无可用字节 
                this.appending = false;
                this.doAppending();
                break;
            case "error":
                break;
        }
    }
    onSBUpdateEnd(){
        let pending = this.segments.reduce((counter, segment) => (segment.parent === parent) ? counter + 1 : counter, 0);
        this.pendingBuffering = pending > 0;
        this._checkAppendedParsed();
        //this.doAppending();
    }

    /** 检测append的数据是否解析完 */
    _checkAppendedParsed(){
        // trigger handler right now
        
    }


    doAppending(){
        let hls = this.hls, sourceBuffer = this.sourceBuffer, segments = this.segments;
        if (Object.keys(sourceBuffer).length) {
            if (this.media.error) {
                console.log("error", this.media.error)
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
                            //console.log("appendBuffer:", segment)
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
                    
                }
            }else{
                
                
            }
        }
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
              sb.addEventListener('updateend', this.evtOnSourceBufferEvent);
              sb.addEventListener('error', this.evtOnSourceBufferEvent);
              //this.tracks[trackName] = { codec: codec, container: track.container };
              track.buffer = sb;
            } catch (err) {
              window.debug && console.error(`error while trying to add sourceBuffer:${err.message}`);
              //this.hls.trigger(Event.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.BUFFER_ADD_CODEC_ERROR, fatal: false, err: err, mimeType: mimeType });
            }
          }
        }
        //this.hls.trigger(Event.BUFFER_CREATED, { tracks: tracks });
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

    get state(){
        return this._state;
    }
    
    startLoad(){
        this.loader.open( this.option.url );
        //this.loader.open( this.)
    }
    play(){}
}

export default BufferStream;
export { BufferStream };