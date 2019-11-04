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

export default urls;
export { urls };