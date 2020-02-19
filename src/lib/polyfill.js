String.prototype.padStart = String.prototype.padStart || function( length, pad ){
	let charstr = String( pad );
	let val = String( this );
	let len = length >> 0;
	let maxlen = Math.ceil( len, val.length );
	let chars = [];
	while( maxlen -- ){
		chars.push( charstr );
	}
	return chars.join('').substring(0, len - val.length) + val;
}

window.globalVar = window.globalVar || new Proxy(function(){}, {
	get(target, key) {
		let prefix = ['','webkit','moz','ms','o'];
		while( prefix.length ){
			let n = prefix.shift();
			if( window[ n + key ] ){
				return window[ n + key ];
				break;
			}
		}
		return null;
	},
	set(target, key, value) {
		throw Error("window."+ key +" 不允许通过 globalVar 设置");
		return Reflect.set(target, key, value);
	}
});


window.MediaSource = window.MediaSource || window.WebkitMediaSource || window.mozMediaSource