import EventEmitter from 'event-emitter'

class IPlayer{
	constructor( option ){
		EventEmitter(this);
	}

	

	set state( value ){}
	get state(){ return 0 };

	set autoplay( value = true ){}
	get autoplay(){ return true };

	set preload( value = true ){}
	get preload(){ return true }

	set currentTime( value ){}
	get currentTime(){ return 0; }

	set volume( value ){}
	get volume(){}

	set muted( value = true ){}
	get muted(){}


	get paused(){}
	get played(){}

	get error(){ return 0 }
	get duration(){ return 0; }

	seek( time = 0 ){}
	/**
	 * 停止播放，播放头恢复初始0位置
	 * @return void
	 */
	stop(){}
	play(){}
	resume(){}

	set definition( value ){}
	get definition(){ return '' }
}
export default IPlayer;
