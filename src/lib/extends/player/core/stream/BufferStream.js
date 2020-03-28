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
                console.log("initSegment",data)
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

                        this.pendingTracks[trackName] = track;

                        window.debug && console.log(`main track:${trackName},container:${track.container},codecs[level/parsed]=[${track.levelCodec}/${track.codec}]`);
                        let initSegment = track.initSegment;
                        if (initSegment) {
                            this.appended = true;
                            // arm pending Buffering flag before appending a segment
                            this.pendingBuffering = true;
                            this.pushTrack( { type: trackName, data: initSegment, parent: 'main', content: 'initSegment' } )
                            
                        }
                    }
                    this._state = STATE.IDLE;
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
                console.log("parsing..........", this._state)
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
                this.onSBUpdateEnd();
                break;
            case "error":
                console.log("buffer error");
                break;
        }
    }
    onSBUpdateEnd(){
        let pending = this.segments.reduce((counter, segment) => (segment.parent === parent) ? counter + 1 : counter, 0);
        this.pendingBuffering = pending > 0;
        this._checkAppendedParsed();
        this.doAppending();
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
                            sb.appendBuffer(segment.data);                           
                            this.appendError = 0;
                            this.appended++;
                            this.appending = true;
                        } else {
                            segments.unshift(segment);
                        }
                    } else {
                        this.onSBUpdateEnd();
                    }
                } catch (err) {
                    console.error("appendBuffer error:", err)
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
                
                maxBufLen = this.option.maxBufferLength || 600;
                if (bufferLen < maxBufLen ) {                    
                    
                    this.checkPendingTracks();
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
                            console.error("appendBuffer error:", err)
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
        this.loader = new Loader({type:'range'});
        console.log("loader", this.loader)
        this.loader.on('data', res=>{
            this.demuxer.push( res.data.chunk, [], '','', {cc:0})
        })

        this.loader.open( this.option, {start:0,end:100*1024} );
        //this.loader.open( this.)
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

    async play(){
        if( this._state == STATE.PEDDING ){
            //this.loader.open( this.option.url );
        }else{
            super.play();
        }
    }
}

export default BufferStream;
export { BufferStream };