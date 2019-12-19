// http://jsperf.com/uncurrythis
// 反科里化
Function.prototype.unCurrying = function(){
	var f = this;
    return function () {
        var a = arguments;
        return f.apply(a[0], [].slice.call(a, 1));
    };
}

Function.prototype.currying = function(){
	var that = this;
    return function() {
        return Function.prototype.call.apply(that, arguments);
    }
}
window.globalVar = window.globalVar || new Proxy({}, {
	get(target, key) {
		let prefix = ['','webkit','moz','ms','o'];
		while( prefix.length ){
			let n = prefix.shift();;			
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