import config from "./config.js";
import utils from "./core/utils";
import urls from "./core/urls";
var UAParser = require('ua-parser-js');
let parser = new UAParser();
console.log("parser", parser.getResult(),parser)
let reporter = {};
let base = {
	refer: encodeURIComponent( document.referrer),
	url:encodeURIComponent( location.href )
}
reporter.log = ( type, options )=>{
	options = Object.assign(Object.assign({},base), options);
	options.platform = [parser.getOS().name , parser.getOS().version].join(" ");

	let devices = parser.getDevice();
	if( devices && devices.model ){
		options.mobile = [ devices.vendor||"", devices.model].join(" ");
	}
	let browser = parser.getBrowser();
	options.browser = [ browser.name, browser.version ].join(" ");
	let url = config.host.report;
	url += "/log?action=" + type;
	url = urls.addParams( url, options );	
	(new Image()).src = url;
}

export default reporter;
export {reporter};