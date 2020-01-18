import EventEmitter from 'event-emitter'
class IDataProvider{
	constructor( option ){
		EventEmitter( this )
	}
	trigger( event, ...data ){
		this.emit(event, {type:event,target:this}, ...data);
	}

	reset(){
		this.trigger('unload')
	}
}

export default IDataProvider
export {IDataProvider}