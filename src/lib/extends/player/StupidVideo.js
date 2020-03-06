import EventEmitter from 'event-emitter'
import { Loader } from '@/lib/loader'
import { Demuxer } from './core/stream/demux';
import { HLSEvent, MediaEvent } from './event/HLSEvent';

class StupidVideo{
	constructor( option ){
		EventEmitter(this);

		let root = option.target || document.body;
		this.video = document.createElement("video");
		this.video.setAttribute("controls",true)
		this.video.setAttribute("autoplay",true)
		root.appendChild( this.video )

		this.demuxer = new Demuxer( this );

		let media = this.video;
        media.addEventListener('seeking', this.onVideoEvent.bind(this) );
        media.addEventListener('seeked', this.onVideoEvent.bind(this) );
        media.addEventListener('loadedmetadata', this.onVideoEvent.bind(this) );
        media.addEventListener('ended', this.onVideoEvent.bind(this) );

        var ms = this.mediaSource = new MediaSource();
        ms.addEventListener('sourceopen', this.onMediaSourceEvent.bind(this));
        ms.addEventListener('sourceended', this.onMediaSourceEvent.bind(this));
        ms.addEventListener('sourceclose', this.onMediaSourceEvent.bind(this));

        media.src = URL.createObjectURL(ms);

        this.sourceBuffer = null;
        this.mp4segments = null;

        this.on( HLSEvent.FRAG_PARSED, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.onDemuxEvent.bind(this) );
	}

	trigger( type, data ){
		let evt = { type:type }
		this.emit( type, evt, data )
	}

	get option(){
		return {

		}
	}
	onVideoEvent(e){
		console.log("on videoevent:", e );
		if( e.type == 'loadedmetadata'){
			console.log("视频时长：", media.duration)
		}
	}

	onMediaSourceEvent(e){
		switch(e.type){
			case 'sourceopen':
				this.load();
				break;
		}
	}

	onDemuxEvent( e , data){
		console.log("on demux event", e, data)
		let self = this;
		let mediaSource = this.mediaSource;
        switch( e.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
            	let track = null;
            	let tracks = data.tracks;
            	if( !this.sourceBuffer || Object.keys(this.sourceBuffer).length === 0){
            		this.sourceBuffer = {};
            		for (let trackName in tracks){
            			track = tracks[ trackName ];
            			let codec = track.levelCodec || track.codec;
            			let mimeType = `${track.container};codecs=${codec}`;
            			console.log( trackName, codec, mimeType );
            			try {
				            let sb = this.sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
				            sb.addEventListener('updateend', this.onSourceBufferEvent.bind(this, track));
				            sb.addEventListener('error', this.onSourceBufferEvent.bind(this, track));
			              	track.buffer = sb;
			            } catch (err) {
			            }
            		}
            				                
            	}

            	if( !this.mp4segments ){
            		this.mp4segments = [];
            	}
            	for (let trackName in tracks){
            		track = tracks[trackName];
            		this.mp4segments.push({
            			type:trackName,
            			data:track.initSegment
            		})
            	}
                this.checkPedding();
                break;
            case HLSEvent.FRAG_PARSING:
                //由Demuxer主动触发
                this._state =  STATE.PARSING;
                break;
            case HLSEvent.FRAG_PARSING_DATA:
                
                break;
            case HLSEvent.FRAG_PARSED:
                
                break;
        }
	}

	onSourceBufferEvent(data,e){
		console.log("on sourcebuffer event:",e,data)
		switch(e.type){
			case 'updateend':
				this.checkPedding();
				break;
		}
	}


	load(){
		this.loader = new Loader();
        this.loader.on('data', res=>{
            this.demuxer.push( res.data.chunk, [], '','', {
                cc:0,
            } )
        })
		this.loader.open( "http://test.fun.tv/test.flv" );
	}

	checkPedding(){
		if( !this.sourceBuffer ){
			return;
		}
		if( this.sourceBuffer.audio && this.sourceBuffer.audio.updating ){
			return;
		}
		if( this.sourceBuffer.video && this.sourceBuffer.video.updating ){
			return;
		}
		if( this.mp4segments.length){
			let segment = this.mp4segments.shift();
			try{
				this.sourceBuffer[segment.type].appendBuffer(segment.data);
				console.log('*** appendBuffer ***', segment.data)
			}catch(e){
				console.error('*** appendBuffer ***', e)
				this.mp4segments.unshift(segment);
			}
		}
	}
}
export default StupidVideo;