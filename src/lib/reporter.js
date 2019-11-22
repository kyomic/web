import config from "./config.js";
import utils from "./core/utils";
import urls from "./core/urls";
let reporter = {};
let base = {
	refer: encodeURIComponent( document.referrer),
	url:encodeURIComponent( location.href )
}
reporter.log = ( type, options )=>{
	options = Object.assign(Object.assign({},base), options);
	let url = config.host.report;
	url += "/log?action=" + type;
	url = urls.addParams( url, options );	
	(new Image()).src = url;
}

export default reporter;
export {reporter};