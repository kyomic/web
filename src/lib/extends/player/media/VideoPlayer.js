import AbstractPlayer from './AbstractPlayer'
import dom from '@/lib/core/dom';
import utils from '@/lib/core/utils';
import fullScreen from '@/lib/core/fullscreen';
import ControlBar from '../ui/controlbar';


class VideoPlayer extends AbstractPlayer{
	static events = ['play', 'playing', 'pause', 'ended', 'error', 'seeking', 'seeked','timeupdate', 'waiting', 'canplay', 'canplaythrough', 'durationchange', 'volumechange', 'loadeddata', 'loadedmetadata']
	static VideoPlayerOptions = {
		//是否自动播放
		autoplay:true,
		//是否内联播放 
		playsinline:true,
		airplay:true,
		controls:true
		
	}
	constructor( option ){
		super( option );		
		this.option = Object.assign( Object.assign( {}, VideoPlayer.VideoPlayerOptions ), option );
		console.log("videoplayer", option )
		this.bufferTimeoutId = 0
		this.evtOnVideoEvent = this.onVideoEvent.bind( this );
		this.initialize();


		        
	}

	initialize(){
		let tpl = [			
			'<div class="kwp-video">',
			'	<div class="kwp-videobox">',
			'		<video <% if autoplay%> autoplay<%/if%> playsinline="<% playsinline %>" webkit-playsinline="<% playsinline %>" airplay="<% airplay %>" webkit-airplay="<% airplay %>" preload="meta" x-webkit-airplay="allow" x5-video-player-type="h5" x5-video-orientation="h5"></video>',
			'	</div>',
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
		dom.addClass( this._wrapper, 'kwp-player');
		this._wrapper.innerHTML = html;
		this.video = dom.query("video", this._wrapper );

		if( this.option.controls ){
			this.controlbar = new ControlBar( this );
		}

		this.showBuffering();
	}

	onVideoEvent(e){
		//console.log('evt:',e.type)
		switch( e.type ){
			case 'canplaythrough':
			case 'playing':
				this.showBuffering( false );
				break;
			case 'seeking':
			case 'waiting':
				this.showBuffering( true );
				break;
			case 'durationchange':
				console.log("durationchange.duration = ", this.video.duration)
				break;
		}
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
		this.stream.on('playstatechange', this.evtOnVideoEvent );
		this.stream.attachVideo( this.video );

		if ( fullScreen.fullScreenEventName ) {
        	window.addEventListener( fullScreen.fullScreenEventName, (e=>{
        		if(fullScreen.isFullScreen()){
        			this.emit('fullscreen',{type:'fullscreen', fullscreen:true})
        		}else{
        			this.emit('fullscreen',{type:'fullscreen', fullscreen:false})
        		}
        	}))
        }else{
        	let isIos = (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent));
        	if( isIos ){
        		this.video.addEventListener('webkitbeginfullscreen', e=>{
        			this._fullscreen = true;
        			this.emit('fullscreen',{type:'fullscreen', fullscreen:this._fullscreen })
        		})
        		this.video.addEventListener('webkitendfullscreen', e=>{
        			this._fullscreen = false;
        			this.emit('fullscreen',{type:'fullscreen', fullscreen:this._fullscreen })
        		})
        	}
        }
	}

	showBuffering( show = true ){
		if( !this.loading ){
			this.loading = dom.create("div",{style:'display:none'},'loading','<div class="loader">');
			dom.query('.kwp-video-cover', this.wrapper).appendChild( this.loading );
		}
		clearTimeout( this.bufferTimeoutId );
		if( show ){
			this.bufferTimeoutId = setTimeout( _=>{
				dom.setStyle( this.loading, {display:'flex'});
			},1500)
		}else{
			dom.setStyle( this.loading, {display:'none'});
		}
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

	get paused(){
		if( this.stream ){
			return this.stream.paused;
		}
		return false;
	}
	get duration(){
		if( this.stream ){
			return this.stream.duration;
		}
		return 0;
		
	}

	get bufferredTime(){
		if( this.stream ){
			return this.stream.getBufferedRange()[1];
		}
		return 0;
	}
	get currentTime(){
		if( this.stream ){
			return this.stream.currentTime;
		}
		return 0;
	}
	set currentTime( time ){
		if( this.stream ){
			this.stream.currentTime = time;
		}
	}

	set volume( v ){
		if( this.stream ){
			this.stream.volume = v;
		}
	}

	get volume(){
		if( this.stream ){
			return this.stream.volume;
		}
		return 1;
	}

	set muted( v ){
		if( this.stream ){
			this.stream.muted = v;
		}
	}

	get muted(){
		if( this.stream ){
			return this.stream.muted
		}
		return false;
	}

	/** 
	 * 是否处于全屏状态
	 * @member 
	 */

	get isFullScreen(){
		if( fullScreen.supportsFullScreen ){
			return api.isFullScreen();
		}else{
			if( typeof this._fullscreen !='undefined'){
				return this._fullscreen;
			}
		}
		return false;
	}

	toggleFullScreen(){
		let api = fullScreen;
		if ( api.supportsFullScreen ) {
            if ( api.isFullScreen() ) {
                api.cancelFullScreen();
            } else {            	
                api.requestFullScreen( this.wrapper );
            }
        }else{
        	try{
	        	//webkitExitFullscreen();
	        	if( this.isFullScreen ){
	        		this.stream.media.webkitExitFullscreen();
	        	}else{
	        		this.stream.media.webkitEnterFullscreen();
	        	}	        	
	        }catch(e){}
        }
        
	}

	get wrapper(){
		return this._wrapper;
	}
}
export default VideoPlayer;