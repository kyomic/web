import AbstractStream from './AbstractStream'
import { HLSEvent, MediaEvent } from '../../event';
import { Demuxer } from './demux';

class BufferStream extends AbstractStream{
	constructor( provider ){
		super( provider );
        this.provider = provider;
        this.evtOnProiderEvent = this.onProviderEvent.bind( this );
		this.reset();
        this.demuxer = new Demuxer( this );
    }

    onProviderEvent(evt, data){
        console.log("provider evt", evt, data)
        switch( evt.type ){
            case 'load':
                this._levels = [

                ]
                break
            case 'append':
                var currentLevel = {},
                    audioCodec = currentLevel.audioCodec,
                    videoCodec = currentLevel.videoCodec;
                let fragCurrent = {
                    sn:data.sn,
                    level:0
                }
                /*
                if( !this.segments ){
                    this.createSourceBuffers( {
                        video:{
                            container:"video/mp4",
                            codec:"mp4a.40.5,avc1.42e01e",
                            data: data.data
                        }
                    })
                    this.segments = [];
                }

                this.segments.push({type:'video', data: data.data })
                this.doAppending();
                */
                this.demuxer.push( data.data, [], audioCodec, videoCodec, fragCurrent, 0, 0, undefined );        
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
        //this.evtOnDemuxEvent = this.onDemuxEvent.bind(this);
        this.evtOnMediaEvent = this.onMediaEvent.bind(this);
        this.evtOnMediaSourceEvent = this.onMediaSourceEvent.bind( this );
        this.evtOnSourceBufferEvent = this.onSourceBufferEvent.bind( this );

        //this.evtOnBufferEvent = this.onBufferEvent.bind( this );


        this.attachEvent();
    }

    attachVideo(video){
        this.media = video;
        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );
    }

    attachEvent(){
        this.provider.on('unload', this.evtOnProiderEvent );
        this.provider.on('load', this.evtOnProiderEvent );
        this.provider.on('append', this.evtOnProiderEvent );

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
                console.log("更新成功")
                this.appending = false;
                this.doAppending();
                this.provider.next();
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
                    
                }
            }else{
                
                
            }
        }
    }

    createSourceBuffers( tracks ){
        let sourceBuffer = this.sourceBuffer, 
            mediaSource = this.mediaSource;
            debugger
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


    pushTrack(){

    }

    tick(){

    }
    startLoad(){
        this.provider.next();
    }
    play(){}
}

export default BufferStream;
export { BufferStream };