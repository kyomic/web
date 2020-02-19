let fullScreen = {
	supportsFullScreen  : false,
    isFullScreen        : function() { return false; },
    requestFullScreen   : function() {},
    cancelFullScreen    : function() {},
    fullScreenEventName : '',
    prefix              : ''
}
var browserPrefixes = [ 'webkit', 'moz', 'o', 'ms', 'khtml' ];
if ( typeof document.cancelFullScreen != 'undefined' ) {
    fullScreen.supportsFullScreen = true;
} else {
    for ( var i = 0, il = browserPrefixes.length; i < il; i++ ) {
        fullScreen.prefix = browserPrefixes[ i ];
        if ( typeof document[ fullScreen.prefix + 'CancelFullScreen' ] != 'undefined' ) {
            fullScreen.supportsFullScreen = true;
            break;
        }
    }
}
if ( fullScreen.supportsFullScreen ) {
    fullScreen.fullScreenEventName = fullScreen.prefix + 'fullscreenchange';
    fullScreen.isFullScreen = function() {
        switch ( this.prefix ) {
            case '':
                return document.fullScreen;
            case 'webkit':
                return document.webkitIsFullScreen;
            default:
                return document[ this.prefix + 'FullScreen' ];
        }
    };
    fullScreen.requestFullScreen = function( el ) {
        return (this.prefix === '') ? el.requestFullScreen() : el[ this.prefix + 'RequestFullScreen' ]();
    };
    fullScreen.cancelFullScreen = function() {
        return (this.prefix === '') ? document.cancelFullScreen() : document[ this.prefix + 'CancelFullScreen' ]();
    }
}

export default fullScreen;