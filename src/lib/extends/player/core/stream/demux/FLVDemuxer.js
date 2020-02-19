function Swap16(src) {
    return (((src >>> 8) & 0xFF) |
            ((src & 0xFF) << 8));
}

function Swap32(src) {
    return (((src & 0xFF000000) >>> 24) |
            ((src & 0x00FF0000) >>> 8)  |
            ((src & 0x0000FF00) << 8)   |
            ((src & 0x000000FF) << 24));
}

function ReadBig32(array, index) {
    return ((array[index] << 24)     |
            (array[index + 1] << 16) |
            (array[index + 2] << 8)  |
            (array[index + 3]));
}

const RemuxerTrackIdConfig = {
  video: 1,
  audio: 2,
  id3: 3,
  text: 4
};

class FLVDemuxer {
  constructor (observer, remuxer) {
    this.observer = observer;
    this.remuxer = remuxer;
    this._littleEndian = undefined;
  }

  static createTrack (type, duration) {
    return {
      container: type === 'video' || type === 'audio' ? 'video/mp2t' : undefined,
      type,
      id: RemuxerTrackIdConfig[type],
      pid: -1,
      inputTimeScale: 90000,
      sequenceNumber: 0,
      samples: [],
      len: 0,
      dropped: type === 'video' ? 0 : undefined,
      isAAC: type === 'audio' ? true : undefined,
      duration: type === 'audio' ? duration : undefined
    };
  }

  resetInitSegment (initSegment, audioCodec, videoCodec, duration) {
    this._firstParse = true;
    this._videoTrack = {type: 'video', id: 1, sequenceNumber: 0, samples: [], length: 0};
    this._audioTrack = {type: 'audio', id: 2, sequenceNumber: 0, samples: [], length: 0};
  }

  resetTimeStamp(){

  }

  // feed incoming data to the front of the parsing pipeline
  append (data, timeOffset, contiguous, accurateTimeOffset) {
    if( typeof this._littleEndian == 'undefined'){
        this._littleEndian = (function () {
            let buf = new ArrayBuffer(2);
            (new DataView(buf)).setInt16(0, 256, true);  // little-endian write
            return (new Int16Array(buf))[0] === 256;  // platform-spec read, if equal then LE
        })();
    }
    let offset = 0;
    let le = this._littleEndian;

    let chunk = data;
    //debug 
    let byteStart = 0;
    if (byteStart === 0) {  // buffer with FLV header
        if (chunk.byteLength > 13) {
            let probeData = FLVDemuxer.probeData(chunk);
            console.log("probeData", probeData)
            //offset = 9 (FileHeader到FileBody的字节数)
            offset = probeData.dataOffset;
        } else {
            return 0;
        }
    }

    if( this._firstParse ){
        this._firstParse = false;
        let v = new DataView(chunk, offset);
        let prevTagSize0 = v.getUint32(0, !le);
        if (prevTagSize0 !== 0) {
            console.log("PrevTagSize0 !== 0 !!!")
        }
        offset += 4;
    }

    console.log("byteStart===",byteStart)
    debugger;
  }

  static probeData( buffer ){
    let data = new Uint8Array(buffer);
    let mismatch = {match: false};
    // 0x46 0x4c 0x56 这几个数字其实就是 'F' 'L' 'V' 的ascii码，表示flv文件头
    // 0x01是flv格式的版本号，用这来检测数据是不是 flv 格式。
    if (data[0] !== 0x46 || data[1] !== 0x4C || data[2] !== 0x56 || data[3] !== 0x01) {
        return mismatch;
    }

    let hasAudio = ((data[4] & 4) >>> 2) !== 0;
    let hasVideo = (data[4] & 1) !== 0;

    let offset = ReadBig32(data, 5);

    if (offset < 9) {
        return mismatch;
    }

    return {
        match: true,
        consumed: offset,
        dataOffset: offset,
        hasAudioTrack: hasAudio,
        hasVideoTrack: hasVideo
    };
  }

  static probe (buffer) {
    let p = FLVDemuxer.probeData( buffer );
    return p && p.match;
  }
}
export {
	FLVDemuxer
}
export default FLVDemuxer;