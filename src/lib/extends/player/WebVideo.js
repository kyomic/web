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
		console.log("#############play")
		this.video.play();
	}
}
export default WebVideo;