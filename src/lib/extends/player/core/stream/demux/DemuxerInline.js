import { MP4Remuxer } from "../remux/MP4Remuxer";
import { PassThroughRemuxer } from '../remux/PassThroughRemuxer'
import { TSDemuxer, MP4Demuxer, FLVDemuxer } from "./index.js"
class DemuxerInline{
	/** 
	 * @param {Object} observer - 绑定的侦听者
	 * @param {config}
	 */

	constructor( observer, typeSupported, config, vendor) {
		//混流器
		this.remuxer = null;
		this.demuxer = null;
		this.observer = observer;
		this.typeSupported = typeSupported;
		this.config = config;
		this.vendor = vendor;
		//this.demuxer = new TSDemuxer( observer );
	}
	/*
	push(data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration) {
		this.demuxer.push ( data, audioCodec, videoCodec, timeOffset, cc, level, sn, duration )
	}
	*/

	probe(data){
		return false;
	}

	push (data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS) {
		console.log("push", arguments)
		if ((data.byteLength > 0) && (decryptdata != null) && (decryptdata.key != null) && (decryptdata.method === 'AES-128')) {
			//TODO
			let decrypter = this.decrypter;
			if (decrypter == null) {
				//TODO
				//decrypter = this.decrypter = new Decrypter(this.observer, this.config);
			}

			let localthis = this;
			// performance.now() not available on WebWorker, at least on Safari Desktop
			let startTime;
			try {
				startTime = performance.now();
			} catch (error) {
				startTime = Date.now();
			}
				decrypter.decrypt(data, decryptdata.key.buffer, decryptdata.iv.buffer, function (decryptedData) {
			let endTime;
			try {
				endTime = performance.now();
			} catch (error) {
				endTime = Date.now();
			}
			localthis.observer.trigger(Event.FRAG_DECRYPTED, { stats: { tstart: startTime, tdecrypt: endTime } });
			localthis.pushDecrypted(new Uint8Array(decryptedData), decryptdata, new Uint8Array(initSegment), audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
			});
		} else {
			this.pushDecrypted(new Uint8Array(data), decryptdata, new Uint8Array(initSegment), audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
		}
	}


	pushDecrypted (data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS) {
		let demuxer = this.demuxer;
		if (!demuxer ||
		// in case of continuity change, or track switch
		// we might switch from content type (AAC container to TS container, or TS to fmp4 for example)
		// so let's check that current demuxer is still valid
		((discontinuity || trackSwitch) && !this.probe(data))) {
			const observer = this.observer;
			const typeSupported = this.typeSupported;
			const config = this.config;
			// probing order is TS/AAC/MP3/MP4
			const muxConfig = [
				{ demux: TSDemuxer, remux: MP4Remuxer },
				{ demux: MP4Demuxer, remux: PassThroughRemuxer },
				{ demux: FLVDemuxer, remux: MP4Remuxer },
				//{ demux: AACDemuxer, remux: MP4Remuxer },
				//{ demux: MP3Demuxer, remux: MP4Remuxer }
			];

			// probe for content type
			for (let i = 0, len = muxConfig.length; i < len; i++) {
				const mux = muxConfig[i];
				const probe = mux.demux.probe;
				if (probe(data)) {
					const remuxer = this.remuxer = new mux.remux(observer, config, typeSupported, this.vendor);
					demuxer = new mux.demux(observer, remuxer, config, typeSupported);
					this.probe = probe;
					break;
				}
			}
			debugger;
			console.log("demuxer,". demuxer, this.remuxer)
			if (!demuxer) {
				observer.trigger(Event.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.FRAG_PARSING_ERROR, fatal: true, reason: 'no demux matching with content found' });
				return;
			}
			this.demuxer = demuxer;
		}
		const remuxer = this.remuxer;

		if (discontinuity || trackSwitch) {
			demuxer.resetInitSegment(initSegment, audioCodec, videoCodec, duration);
			remuxer.resetInitSegment();
		}
		if (discontinuity) {
			demuxer.resetTimeStamp(defaultInitPTS);
			remuxer.resetTimeStamp(defaultInitPTS);
		}
		if (typeof demuxer.setDecryptData === 'function') {
			demuxer.setDecryptData(decryptdata);
		}

		demuxer.append(data, timeOffset, contiguous, accurateTimeOffset);
	}

}

export default DemuxerInline;
export {DemuxerInline}