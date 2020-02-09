import EventEmitter from 'event-emitter'

import { HLSEvent, MediaEvent } from '../../event';
class AbstractStream{
	constructor( option ){
		EventEmitter( this );
		this.option = Object.assign({}, option );

		/**
         * video
         * @member 
         */
        this.media = null;  
        this._paused = false;
		this.emit('attached', {type:'attached', target:this} );
	}
	trigger( type, data ){
		let evt = { type:type }
		this.emit( type, evt, data )
	}

	attachVideo(video){
        this.media = video;
        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );
    }

    async play(){
        this._paused = false;
		if( this.media ){         
            this.emit('playstatechange', {type:'playstatechange'});  
            this._paused = false;
            let promise = this.media.play();
            try{
                promise.catch(e=>{
                    this._paused = true;
                    this.emit('playstatechange', {type:'playstatechange'});
                })
            }catch(e){}			        
		}
	}


    pause(){
        this._paused = true;
        if( this.media ){
            this.media.pause()
        }
        this.emit('playstatechange', {type:'playstatechange'}); 
    }

    get paused () {
    	return this._paused;
	}

    getBufferedRange () {
        let range = [0, 0]
        let video = this.media;
        if( !video ){
        	return [0,0];
        }
        let buffered = video.buffered
        let currentTime = video.currentTime
        if (buffered) {
            for (let i = 0, len = buffered.length; i < len; i++) {
                range[0] = buffered.start(i)
                range[1] = buffered.end(i)
                if (range[0] <= currentTime && currentTime <= range[1]) {
                    break
                }
            }
        }
        if (range[0] - currentTime <= 0 && currentTime - range[1] <= 0) {
            return range
        } else {
            return [0, 0]
        }
    }

    get duration(){
        if( this.media ){
            return this.media.duration;
        }
        return 0;
    }

    get currentTime(){
        if( this.media ){
            return this.media.currentTime;
        }
        return 0;
    }

    set currentTime( time ){
        this._currentTime = time;
        if( this.media ){
            this.media.currentTime = time;
        }
    }

    set volume( v ){
        if( this.media ){
            this.media.volume = v;
        }
    }

    get volume(){
        if( this.media ) return this.media.volume;
        return 1;
    }

    set muted( v ){
        if( this.media ){
            this.media.muted = v;
        }
    }



    get muted(){
        if( this.media ){
            return this.media.muted;
        }
        return false;
    }
	load(){}

	destroy(){}
}

export default AbstractStream;