import EventEmitter from 'event-emitter'
import VideoPlayer from './media/VideoPlayer';
import './ui/style.less'
import '../../polyfill.js'
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

	pause(){
		this.video.pause();
	}


	
	get duration(){
		return this.video.duration;
	}
	get currentTime(){
		return this.video.currentTime;
	}

	set currentTime( time ){
		this.video.currentTime = time;
	}

	get bufferredTime(){
		return this.video.bufferredTime;
	}

	static events = ['play', 'playing', 'pause', 'ended', 'error', 'seeking', 'seeked','timeupdate', 'waiting', 'canplay', 'canplaythrough', 'durationchange', 'volumechange', 'loadeddata', 'loadedmetadata'];
}
export default WebVideo;