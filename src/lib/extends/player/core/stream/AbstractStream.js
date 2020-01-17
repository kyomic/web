import EventEmitter from 'event-emitter'

class AbstractStream{
	constructor( option ){
		EventEmitter( this );
		this.option = Object.assign({}, option );
		this.emit('attached', {type:'attached', target:this} );
	}
	trigger( type, data ){
		let evt = { type:type }
		this.emit( type, evt, data )
	}

	attachVideo(video){
		this.video = video;
	}

	load(){}

	destroy(){}
}

export default AbstractStream;