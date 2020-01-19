import AbstractStream from './AbstractStream'
import { HLSEvent, MediaEvent } from '../../event';
import { Demuxer } from './demux';

class URLStream extends AbstractStream{
	constructor( option ){
		super( option );
        this.url = option.url;

        this.evtOnMediaEvent = this.onMediaEvent.bind( this );
        this.evtOnVideoEvent = this.onVideoEvent.bind( this );
        this.attachEvent();
    }

    attachVideo(video){
        this.media = video;

        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );
    }

    attachEvent(){
        this.on( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }

    onVideoEvent( evt ){
        console.log("videoevent:", evt.type)
    }

    //video attached
    onMediaEvent( evt, data ){
        console.log("onMediaEvent", data)
        switch( evt.type ){
            case MediaEvent.MEDIA_ATTACHING:
                let media = data.media;
                if( typeof this.url == 'string'){
                    media.src = this.url;
                }else{
                    media.src = URL.createObjectURL( this.url );
                }
                break;
        }
    }

    getBufferedRange () {
        let range = [0, 0]
        let video = this.media;
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
        if( this._state == PlayerState.STOPED ){
            return [0,0];
        }
        if (range[0] - currentTime <= 0 && currentTime - range[1] <= 0) {
            return range
        } else {
            return [0, 0]
        }
    }

    play(){}
}

export default URLStream;
export { URLStream };