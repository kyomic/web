import EventEmitter from 'event-emitter'
import VideoPlayer from './media/VideoPlayer';

class WebVideo{
	constructor( option ){
		window.debug = true;
		EventEmitter(this)
		this.video = new VideoPlayer( option );
	}

	attachStream( stream ){
		this.video.attachStream( stream );
	}

	play(){
		this.video.play();
	}

	static events = ['play', 'playing', 'pause', 'ended', 'error', 'seeking', 'seeked','timeupdate', 'waiting', 'canplay', 'canplaythrough', 'durationchange', 'volumechange', 'loadeddata', 'loadedmetadata'];
}
export default WebVideo;