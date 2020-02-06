import AbstractPlayer from './AbstractPlayer'
import dom from '@/lib/core/dom';
import utils from '@/lib/core/utils';
import ControlBar from '../ui/controlbar';


class VideoPlayer extends AbstractPlayer{
	static events = ['play', 'playing', 'pause', 'ended', 'error', 'seeking', 'seeked','timeupdate', 'waiting', 'canplay', 'canplaythrough', 'durationchange', 'volumechange', 'loadeddata', 'loadedmetadata']
	static VideoPlayerOptions = {
		//是否自动播放
		autoplay:true,
		//是否内联播放 
		playsinline:true,
		controls:true
		
	}
	constructor( option ){
		super( option );		
		this.option = Object.assign( Object.assign( {}, VideoPlayer.VideoPlayerOptions ), option );
		console.log("videoplayer", option )
		this.evtOnVideoEvent = this.onVideoEvent.bind( this );
		this.initialize();
	}

	initialize(){
		let tpl = [			
			'<div class="kwp-video">',
			'	<video <% if autoplay%> autoplay<%/if%> playsinline="<% playsinline %>" webkit-playsinline="<% playsinline %>" airplay="<% airplay %>" webkit-airplay="<% airplay %>" preload="meta" x-webkit-airplay="allow" x5-video-player-type="h5" x5-video-orientation="h5"></video>',
			'	<div class="kwp-video-cover">',
			'		<i class="logo"></i>',
			'		<span class="title"></span>',
			'	</div>',
			'</div>',
			'<div class="kwp-control"></div>'
		].join('');

		let html = utils.compile(tpl)( this.option );

		this._wrapper = document.createElement("div");
		let target = this.option.target;
		if( !target || target.nodeType != 1){
			document.body.appendChild( this._wrapper )
		}else{
			target.appendChild( this._wrapper );
		}
		dom.addClass( this._wrapper, 'kwp-video');
		this._wrapper.innerHTML = html;
		this.video = dom.query("video", this._wrapper );

		if( this.option.controls ){
			this.controlbar = new ControlBar( this );
		}

	}

	onVideoEvent(e){
		this.emit( e.type, {type:e.type, target:this, originEvent: e});
	}
	attachStream( stream ){
		if( this.stream ){
			this.stream.destroy();
		}
		this.stream = stream;

		VideoPlayer.events.map(type=>{
			this.video.addEventListener( type, this.evtOnVideoEvent );
		})
		this.stream.attachVideo( this.video );
	}

	play(){
		if( !this.stream ){
			throw new Error("*** 请先设置流: video.attachStream ***")
		}
		this.stream.play();
	}

	pause(){
		if( this.stream ){
			this.stream.pause();
		}		
	}

	get duration(){
		if( this.stream ){
			return this.stream.duration;
		}
		return 0;
		
	}

	get currentTime(){
		if( this.stream ){
			return this.stream.currentTime;
		}
		return 0;
	}
	get wrapper(){
		return this._wrapper;
	}
}
export default VideoPlayer;