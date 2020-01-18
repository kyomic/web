/**
 * passthrough remuxer
*/
import { HLSEvent } from '../../../event'
import { ErrorTypes, ErrorDetails } from '../../../const/Errors';

class PassThroughRemuxer {
  constructor (observer) {
    this.observer = observer;
  }

  destroy () {
  }

  resetTimeStamp () {
  }

  resetInitSegment () {
  }

  remux (audioTrack, videoTrack, id3Track, textTrack, timeOffset, contiguous, accurateTimeOffset, rawData) {
    let observer = this.observer;
    let streamType = '';
    if (audioTrack) {
      streamType += 'audio';
    }

    if (videoTrack) {
      streamType += 'video';
    }

    observer.trigger(HLSEvent.FRAG_PARSING_DATA, {
      data1: rawData,
      startPTS: timeOffset,
      startDTS: timeOffset,
      type: streamType,
      hasAudio: !!audioTrack,
      hasVideo: !!videoTrack,
      nb: 1,
      dropped: 0
    });
    // notify end of parsing
    observer.trigger(HLSEvent.FRAG_PARSED);
  }
}

export default PassThroughRemuxer;
export { PassThroughRemuxer }
