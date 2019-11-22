import Devices from "./Devices";

let urls = {};

urls.getQueryValue = function(key, url) {
	let escapeReg = (source) => {
		return String(source).replace(new RegExp('([.*+?^=!:\x24{}()|[\\]\/\\\\])', 'g'), '\\\x241');
	}
	var reg = new RegExp('(^|&|\\?|#)' + escapeReg(key) + '=([^&#]*)', 'g');
	var match = (url || Devices.getInstance().currentPage ).match(reg);
	if (match) {
		return match[match.length - 1].split('=')[1];
	}
	return null;
};

urls.toParams = function( obj ){
    var arr = [];
    for(var i in obj){
        arr.push(i+"="+arr[i]);
    }
    return arr.join("&");
}
/** 
 * 生成URL地址和参数格式,如{url, params}
 */
urls.parseURL = function( url ){
    var urls = url.split("?");
    var paramstr = "";
    if( urls.length > 1 ){
        paramstr = urls[1]
    }
    url = urls[0];
    var arr = paramstr.split("&");
    var params = {};
    for(var i=0;i<arr.length;i++){
        var s = arr[i].split("=");
        if( s && s[0]){
            var v = '';
            try{
                v = decodeURIComponent( s[1])
            }catch(e){
                v = s[1];
            }
            params[s[0]] = s[1];
        }
    }
    return {
        url:url, params: params
    }
}
urls.concatURL = function( url, params ){
    var arr = [];
    for( var i in params){
        arr.push( i+"="+params[i]);
    }
    if( url.indexOf("?")==-1){
        return url + "?" + arr.join("&");
    }
    return url + "&" + arr.join("&");
};
urls.addParams = function( url, params ){
    var info = urls.parseURL( url );
    params = params || {};
    var newparams = Object.assign(Object.assign({}, info.params), params );
    return urls.concatURL( info.url, newparams );
};


export default urls;
export { urls };