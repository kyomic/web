

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