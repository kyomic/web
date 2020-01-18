import AbstractPlayer from './AbstractPlayer'
import dom from '@/lib/core/dom';
import utils from '@/lib/core/utils';


class VideoPlayer extends AbstractPlayer{
	static VideoPlayerOptions = {
		autoplay:true, 
		playsinline:true,
		
	}
	constructor( option ){
		super( option );
		console.log("videoplayer", option )
		this.option = Object.assign( Object.assign( {}, VideoPlayer.VideoPlayerOptions ), option );
		this.initialize();
	}

	initialize(){
		let tpl = [			
			'<div class="fxp-video">',
			'	<video <% if autoplay%> autoplay<%/if%> playsinline="<% playsinline %>" webkit-playsinline="<% playsinline %>" airplay="<% airplay %>" webkit-airplay="<% airplay %>" preload="meta" x-webkit-airplay="allow" x5-video-player-type="h5" x5-video-orientation="h5"></video>',
			'	<div class="fxp-video-cover">',
			'		<i class="logo"></i>',
			'		<span class="title"></span>',
			'	</div>',
			'</div>',
			'<div class="fxp-control"></div>'
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

	}

	attachStream( stream ){
		if( this.stream ){
			this.stream.destroy();
		}
		this.stream = stream;
		this.stream.attachVideo( this.video );
	}

	play(){
		this.stream.play();
	}
	get wrapper(){
		return this._wrapper;
	}
}
export default VideoPlayer;