import { MP4Remuxer } from "../remux/MP4Remuxer";
import { TSDemuxer } from "./index.js"
class DemuxerInline{
	/** 
	 * @param {Object} observer - 绑定的侦听者
	 * @param {config}
	 */
	constructor( observer, config ){
		//混流器
		this.remuxer = null;
		this.demuxer = new TSDemuxer( observer );
	}

	push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration) {
		this.demuxer.push ( data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration )
	}

}

export default DemuxerInline;
export {DemuxerInline}