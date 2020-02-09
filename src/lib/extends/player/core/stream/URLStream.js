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
        console.log("evt",evt)
        this.emit( evt.type, {type:evt.type, target:this, originEvent: evt});
    }

    //video attached
    onMediaEvent( evt, data ){
        console.log("onMediaEvent", data)
        switch( evt.type ){
            case MediaEvent.MEDIA_ATTACHING:
                let media = data.media;

                media.addEventListener('seeking', this.evtOnVideoEvent );
                media.addEventListener('seeked', this.evtOnVideoEvent );
                media.addEventListener('loadedmetadata', this.evtOnVideoEvent);
                media.addEventListener('ended', this.evtOnVideoEvent );
                media.addEventListener('timeupdate', this.evtOnVideoEvent );

                if( typeof this.url == 'string'){
                    media.src = this.url;
                }else{
                    media.src = URL.createObjectURL( this.url );
                }
                break;
        }
    }
}

export default URLStream;
export { URLStream };