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


// build an absolute URL from a relative one using the provided baseURL
// if relativeURL is an absolute URL it will be returned as is.
urls.buildAbsoluteURL = function(baseURL, relativeURL) {
    // remove any remaining space and CRLF
    relativeURL = (relativeURL||"").replace(/(^\s*)|(\s*$)/g, '');
    if (/^[a-z]+:/i.test(relativeURL)) {
        // complete url, not relative
        return relativeURL;
    }

    var relativeURLQuery = null;
    var relativeURLHash = null;

    var relativeURLHashSplit = /^([^#]*)(.*)$/.exec(relativeURL);
    if (relativeURLHashSplit) {
        relativeURLHash = relativeURLHashSplit[2];
        relativeURL = relativeURLHashSplit[1];
    }
    var relativeURLQuerySplit = /^([^\?]*)(.*)$/.exec(relativeURL);
    if (relativeURLQuerySplit) {
        relativeURLQuery = relativeURLQuerySplit[2];
        relativeURL = relativeURLQuerySplit[1];
    }

    var baseURLHashSplit = /^([^#]*)(.*)$/.exec(baseURL);
    if (baseURLHashSplit) {
        baseURL = baseURLHashSplit[1];
    }
    var baseURLQuerySplit = /^([^\?]*)(.*)$/.exec(baseURL);
    if (baseURLQuerySplit) {
        baseURL = baseURLQuerySplit[1];
    }

    var baseURLDomainSplit = /^((([a-z]+):)?\/\/[a-z0-9\.-]+(:[0-9]+)?\/)(.*)$/i.exec(baseURL);
    var baseURLProtocol = baseURLDomainSplit[3];
    var baseURLDomain = baseURLDomainSplit[1];
    var baseURLPath = baseURLDomainSplit[5];

    var builtURL = null;
    if (/^\/\//.test(relativeURL)) {
        builtURL = baseURLProtocol + '://' + this.buildAbsolutePath('', relativeURL.substring(2));
    } else if (/^\//.test(relativeURL)) {
        builtURL = baseURLDomain + this.buildAbsolutePath('', relativeURL.substring(1));
    } else {
        var newPath = this.buildAbsolutePath(baseURLPath, relativeURL);
        builtURL = baseURLDomain + newPath;
    }

    // put the query and hash parts back
    if (relativeURLQuery) {
        builtURL += relativeURLQuery;
    }
    if (relativeURLHash) {
        builtURL += relativeURLHash;
    }
    return builtURL;
}

// build an absolute path using the provided basePath
        // adapted from https://developer.mozilla.org/en-US/docs/Web/API/document/cookie#Using_relative_URLs_in_the_path_parameter
        // this does not handle the case where relativePath is "/" or "//". These cases should be handled outside this.
urls.buildAbsolutePath = function(basePath, relativePath) {
    var sRelPath = relativePath;
    var nUpLn, sDir = '',
    sPath = basePath.replace(/[^\/]*$/, sRelPath.replace(/(\/|^)(?:\.?\/+)+/g, '$1'));
    for (var nEnd, nStart = 0; nEnd = sPath.indexOf('/../', nStart), nEnd > -1; nStart = nEnd + nUpLn) {
        nUpLn = /^\/(?:\.\.\/)*/.exec(sPath.slice(nEnd))[0].length;
        sDir = (sDir + sPath.substring(nStart, nEnd)).replace(new RegExp('(?:\\\/+[^\\\/]*){0,' + (nUpLn - 1) / 3 + '}$'), '/');
    }
    return sDir + sPath.substr(nStart);
}

urls.resolve = function( basePath, relativePath ){
    return urls.buildAbsoluteURL( basePath, relativePath );
}
export default urls;
export { urls };