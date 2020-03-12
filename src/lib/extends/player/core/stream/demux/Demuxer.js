import DemuxerInline from './DemuxerInline';
import EventEmitter from 'event-emitter'

//import work from 'webworkify-webpack';
import { HLSEvent } from '../../../event/HLSEvent'
import { ErrorTypes, ErrorDetails } from '../../../const/Errors';

// see https://stackoverflow.com/a/11237259/589493
/* eslint-disable-next-line no-undef */
const window = (typeof window==='undefined'?self:window); // safeguard for code that might run both on worker and main thread
const MediaSource = window.MediaSource || window.WebKitMediaSource;

class Demuxer {
  constructor ( hls , id) {
  	this.hlstream = hls;
  	this.id = id;

  	

  	const observer = this.observer = new EventEmitter();
    const config = this.hlstream.option;

    this.demuxer = new DemuxerInline( observer );    
    observer.trigger = function trigger (event, ...data) {
      observer.emit(event, event, ...data);
    };
    observer.off = function off (event, ...data) {
      observer.removeListener(event, ...data);
    };

    this.frag = null;

    let forwardMessage = function (ev, data) {
      //console.log("message", ev, data)
      data = data || {};
      data.frag = this.frag;
      data.id = this.id;
      hls.trigger(ev, data);
    }.bind(this);

    // forward events to main thread
    observer.on(HLSEvent.FRAG_DECRYPTED, forwardMessage);

    observer.on(HLSEvent.FRAG_PARSING_INIT_SEGMENT, forwardMessage);
    observer.on(HLSEvent.FRAG_PARSING_DATA, forwardMessage);
    observer.on(HLSEvent.FRAG_PARSED, forwardMessage);
    observer.on(HLSEvent.FRAG_PARSING, forwardMessage);


    observer.on(HLSEvent.ERROR, forwardMessage);
    observer.on(HLSEvent.FRAG_PARSING_METADATA, forwardMessage);
    observer.on(HLSEvent.FRAG_PARSING_USERDATA, forwardMessage);
    observer.on(HLSEvent.INIT_PTS_FOUND, forwardMessage);

    const typeSupported = {
      mp4: MediaSource ? MediaSource.isTypeSupported('video/mp4'):false,
      mpeg: MediaSource ? MediaSource.isTypeSupported('audio/mpeg'):false,
      mp3: MediaSource ? MediaSource.isTypeSupported('audio/mp4; codecs="mp3"'):false
    };
    // navigator.vendor is not always available in Web Worker
    // refer to https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/navigator
    const vendor = navigator.vendor;
    if (config.enableWorker && (typeof (Worker) !== 'undefined')) {
     
      window.debug && console.log('demuxing in webworker');
      let w;
      try {
        w = this.w = work(require.resolve('./demuxer-worker.js'));
        this.onwmsg = this.onWorkerMessage.bind(this);
        w.addEventListener('message', this.onwmsg);
        w.onerror = function (event) {
          hls.trigger(Event.ERROR, { type: ErrorTypes.OTHER_ERROR, details: ErrorDetails.INTERNAL_EXCEPTION, fatal: true, event: 'demuxerWorker', err: { message: event.message + ' (' + event.filename + ':' + event.lineno + ')' } });
        };
        w.postMessage({ cmd: 'init', typeSupported: typeSupported, vendor: vendor, id: id, config: JSON.stringify(config) });
      } catch (err) {
        window.debug && console.error('error while initializing DemuxerWorker, fallback on DemuxerInline');
        if (w) {
          // revoke the Object URL that was used to create demuxer worker, so as not to leak it
          window.URL.revokeObjectURL(w.objectURL);
        }
        this.demuxer = new DemuxerInline(observer, typeSupported, config, vendor);
        this.w = undefined;
      }
    } else {
      this.demuxer = new DemuxerInline(observer, typeSupported, config, vendor);
    }
  }

  destroy () {
    let w = this.w;
    if (w) {
      w.removeEventListener('message', this.onwmsg);
      w.terminate();
      this.w = null;
    } else {
      let demuxer = this.demuxer;
      if (demuxer) {
        demuxer.destroy();
        this.demuxer = null;
      }
    }
    let observer = this.observer;
    if (observer) {
      observer.removeAllListeners();
      this.observer = null;
    }
  }

  /**
   * @param {Uint8Array} data - 流数据
   * @param {Uint8Array} initSegment -初始碎片数据
   * @param {String} audioCodec - 音频编码类型
   * @param {String} videoCodec - 视频编码类型
   * @param {Object} frag - 碎片信息  
   * { byteRangeEndOffset, byteRangeStartOffset, cc, decryptdata, duration, startPTD,endPTS, idx, level, sn, start }
   * @param {number} duration - 视频总时长
   * @param {number} accurateTimeOffset 精确的时间偏移
   * @param {number} defaultInitPTS 初始化的pts
   */
  push (data, initSegment, audioCodec, videoCodec, frag, duration, accurateTimeOffset, defaultInitPTS) {
    const w = this.w;
    const timeOffset = !isNaN(frag.startDTS) ? frag.startDTS : frag.start;
    const decryptdata = frag.decryptdata;
    const lastFrag = this.frag;
    let discontinuity = !(lastFrag && (frag.cc === lastFrag.cc));
    const trackSwitch = !(lastFrag && (frag.level === lastFrag.level));
    const nextSN = lastFrag && (frag.sn === (lastFrag.sn + 1));
    let contiguous = !trackSwitch && nextSN;
    if (discontinuity) {
      window.debug && console.log(`${this.id}:discontinuity detected`);
    }


    //add by wangxk
    //discontinuity = false;
    //contiguous = true;
    if (trackSwitch) {
      window.debug && console.log(`${this.id}:switch detected`);
    }

    this.frag = frag;
    if (w) {
      // post fragment payload as transferable objects for ArrayBuffer (no copy)
      w.postMessage({ cmd: 'demux', data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS }, data instanceof ArrayBuffer ? [data] : []);
    } else {
      let demuxer = this.demuxer;
      if (demuxer) {
        demuxer.push(data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
      }
    }
  }

  onWorkerMessage (ev) {
    let data = ev.data,
      hls = this.hls;
    switch (data.event) {
    case 'init':
      // revoke the Object URL that was used to create demuxer worker, so as not to leak it
      window.URL.revokeObjectURL(this.w.objectURL);
      break;
      // special case for FRAG_PARSING_DATA: data1 and data2 are transferable objects
    case Event.FRAG_PARSING_DATA:
      data.data.data1 = new Uint8Array(data.data1);
      if (data.data2) {
        data.data.data2 = new Uint8Array(data.data2);
      }

      /* falls through */
    default:
      data.data = data.data || {};
      data.data.frag = this.frag;
      data.data.id = this.id;
      hls.trigger(data.event, data.data);
      break;
    }
  }
}


export default Demuxer;
export {
	Demuxer
}