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
