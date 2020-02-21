import AMF from '../../parser/AMF'
import SPSParser from '../../parser/sps-parser'

import MediaInfo from './media-info'

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
    this._dispatch = false;

    this._timestampBase = 0;  // int32, in milliseconds
    this._timescale = 1000;


    this._audioInitialMetadataDispatched = false;
    this._videoInitialMetadataDispatched = false;

    this._referenceFrameRate = {
      fixed: true,
      fps: 23.976,
      fps_num: 23976,
      fps_den: 1000
    };
    this._flvSoundRateTable = [5500, 11025, 22050, 44100, 48000];

    this._mpegSamplingRates = [
        96000, 88200, 64000, 48000, 44100, 32000,
        24000, 22050, 16000, 12000, 11025, 8000, 7350
    ];

    this._mpegAudioV10SampleRateTable = [44100, 48000, 32000, 0];
    this._mpegAudioV20SampleRateTable = [22050, 24000, 16000, 0];
    this._mpegAudioV25SampleRateTable = [11025, 12000, 8000,  0];

    this._mpegAudioL1BitRateTable = [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, -1];
    this._mpegAudioL2BitRateTable = [0, 32, 48, 56,  64,  80,  96, 112, 128, 160, 192, 224, 256, 320, 384, -1];
    this._mpegAudioL3BitRateTable = [0, 32, 40, 48,  56,  64,  80,  96, 112, 128, 160, 192, 224, 256, 320, -1];



    this._mediaInfo = new MediaInfo();
    this._metadata = null;
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
    this._videoTrack = {type: 'video', id: 1, sequenceNumber: 0, samples: [],sps:[], pps:[], length: 0, inputTimeScale: 1};
    this._audioTrack = {type: 'audio', id: 2, sequenceNumber: 0, samples: [],sps:[], pps:[], length: 0, inputTimeScale: 1};

    this._id3Track = {type: 'id3', id: 3, sequenceNumber: 0, samples: [], length: 0};
    this._txtTrack = {type: 'text', id: 4, sequenceNumber: 0, samples: [], length: 0};

    this._videoInitialMetadataDispatched = false;
    this._audioInitialMetadataDispatched = false;
  }

  resetTimeStamp(){

  }

  _isInitialMetadataDispatched() {
    if (this._hasAudio && this._hasVideo) {  // both audio & video
      return this._audioInitialMetadataDispatched && this._videoInitialMetadataDispatched;
    }
    if (this._hasAudio && !this._hasVideo) {  // audio only
      return this._audioInitialMetadataDispatched;
    }
    if (!this._hasAudio && this._hasVideo) {  // video only
      return this._videoInitialMetadataDispatched;
    }
    return false;
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

    let chunk = data.buffer;
    //debug 
    let byteStart = 0;
    if (byteStart === 0) {  // buffer with FLV header
        if (chunk.byteLength > 13) {
            let probeData = FLVDemuxer.probeData(chunk);
            console.log("probeData", probeData)
            //offset = 9 (FileHeader到FileBody的字节数)

            this._mediaInfo.hasAudio = probeData.hasAudioTrack;
            this._mediaInfo.hasVideo = probeData.hasVideoTrack;
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
    //offset = 13 (前13字节为文件头)
    console.log("byteStart===",byteStart)
    while (offset < chunk.byteLength) {
      this._dispatch = true;
      let v = new DataView(chunk, offset);
      if (offset + 11 + 4 > chunk.byteLength) {
          // data not enough for parsing an flv tag
          break;
      }
      //实际上真正用到的只有三种type，8、9、18 分别对应，音频、视频和Script Data。
      

      /* (共11字节)
      UI8 tag type
      UI24 data size
      UI24 timestamp
      UI8 TimestampExtended
      UI24 StreamID
      */
      let tagType = v.getUint8(0);
      let dataSize = v.getUint32(0, !le) & 0x00FFFFFF;
      if (offset + 11 + dataSize + 4 > chunk.byteLength) {
          // data not enough for parsing actual data body
          break;
      }
      if (tagType !== 8 && tagType !== 9 && tagType !== 18) {
          console.log(this.TAG, `Unsupported tag type ${tagType}, skipped`);
          // consume the whole tag (skip it)
          offset += 11 + dataSize + 4;
          continue;
      }

      let ts2 = v.getUint8(4);
      let ts1 = v.getUint8(5);
      let ts0 = v.getUint8(6);
      let ts3 = v.getUint8(7);

      let timestamp = ts0 | (ts1 << 8) | (ts2 << 16) | (ts3 << 24);
      //add by wangxk

      let streamId = v.getUint32(7, !le) & 0x00FFFFFF;
      if (streamId !== 0) {
          console.log(this.TAG, 'Meet tag which has StreamID != 0!');
      }

      let dataOffset = offset + 11;
      let map = {8:"音频",9:"视频",18:"脚本"}
      console.log("tagType:", tagType, "(", map[tagType] ,")dataSize", dataSize, 'timestamp', timestamp)


      switch (tagType) {
          case 8:  // Audio
              this._parseAudioData(chunk, dataOffset, dataSize, timestamp);
              break;
          case 9:  // Video
              this._parseVideoData(chunk, dataOffset, dataSize, timestamp, byteStart + offset);
              break;
          case 18:  // ScriptDataObject
              this._parseScriptData(chunk, dataOffset, dataSize);
              break;
      }

      let prevTagSize = v.getUint32(11 + dataSize, !le);
      if (prevTagSize !== 11 + dataSize) {
          console.log(this.TAG, `Invalid PrevTagSize ${prevTagSize}`);
      }
      console.log("#####################")
      offset += 11 + dataSize + 4;  // tagBody + dataSize + prevTagSize

      
    }
    // dispatch parsed frames to consumer (typically, the remuxer)
    if (this._isInitialMetadataDispatched()) {
      if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) {
        this._onDataAvailable(this._audioTrack, this._videoTrack);
      }
    }
    return offset;
  }

  _onMediaInfo( mediainfo ){
    console.log("@@@@@@@@@MediaInfo", mediainfo)

    this.remuxer.remux( this._audioTrack, this._videoTrack, this._id3Track, this._txtTrack, 0 );
    throw new Error("end")
  }
  _onDataAvailable( audioTrack, videoTrack ){
    console.log("数据可用....", audioTrack, videoTrack)
    //this.remuxer.remux(audioTrack, videoTrack, this._id3Track, this._txtTrack, 0 );
  }
  /** 
   * 一般情况只触发一次
   */
  _onTrackMetadata(type, meta){
    console.log("###_onTrackMetadata", type, meta)
  }

  /**
   * @param {ArrayBuffer} chunk 
   * @param {int} dataOffset - 数据偏移
   */
  _parseScriptData( chunk, dataOffset, dataSize ){
    let scriptData = AMF.parseScriptData(chunk, dataOffset, dataSize);
    console.log("scriptData")
    this._metadata = scriptData;
    let onMetaData = this._metadata.onMetaData;
    if (typeof onMetaData.hasAudio === 'boolean') {  // hasAudio
      this._hasAudio = onMetaData.hasAudio;
      this._mediaInfo.hasAudio = this._hasAudio;
    }
    if (typeof onMetaData.hasVideo === 'boolean') {  // hasVideo
      this._hasVideo = onMetaData.hasVideo;
      this._mediaInfo.hasVideo = this._hasVideo;
    }
    if (typeof onMetaData.audiodatarate === 'number') {  // audiodatarate
      this._mediaInfo.audioDataRate = onMetaData.audiodatarate;
    }
    if (typeof onMetaData.videodatarate === 'number') {  // videodatarate
      this._mediaInfo.videoDataRate = onMetaData.videodatarate;
    }
    if (typeof onMetaData.width === 'number') {  // width
      this._mediaInfo.width = onMetaData.width;
    }
    if (typeof onMetaData.height === 'number') {  // height
      this._mediaInfo.height = onMetaData.height;
    }
    if (typeof onMetaData.duration === 'number') {  // duration
      //let duration = Math.floor(onMetaData.duration * this._timescale);
      let duration = onMetaData.duration;
      this._duration = duration;
      this._mediaInfo.duration = duration;
    } else {
      this._mediaInfo.duration = 0;
    }
    if (typeof onMetaData.framerate === 'number') {  // framerate
      let fps_num = Math.floor(onMetaData.framerate * 1000);
      if (fps_num > 0) {
        let fps = fps_num / 1000;
        this._referenceFrameRate.fixed = true;
        this._referenceFrameRate.fps = fps;
        this._referenceFrameRate.fps_num = fps_num;
        this._referenceFrameRate.fps_den = 1000;
        this._mediaInfo.fps = fps;
      }
    }
    if (typeof onMetaData.keyframes === 'object') {  // keyframes
      this._mediaInfo.hasKeyframesIndex = true;
      let keyframes = onMetaData.keyframes;
      this._mediaInfo.keyframesIndex = this._parseKeyframesIndex(keyframes);
      onMetaData.keyframes = null;  // keyframes has been extracted, remove it
    } else {
      this._mediaInfo.hasKeyframesIndex = false;
    }
    this._dispatch = false;
    this._mediaInfo.metadata = onMetaData;
    window.debug && window.console.log(this.TAG, 'Parsed onMetaData');
    console.log("mediaInfo", this._mediaInfo)
    if (this._mediaInfo.isComplete()) {
      this._onMediaInfo(this._mediaInfo);
    }
  }

  _parseKeyframesIndex(keyframes) {
    let times = [];
    let filepositions = [];

    // ignore first keyframe which is actually AVC Sequence Header (AVCDecoderConfigurationRecord)
    for (let i = 1; i < keyframes.times.length; i++) {
      let time = this._timestampBase + Math.floor(keyframes.times[i] * 1000);
      times.push(time);
      filepositions.push(keyframes.filepositions[i]);
    }

    return {
        times: times,
        filepositions: filepositions
    };
  }

  _parseVideoData(arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition) {
    if (dataSize <= 1) {
      window.debug && window.console.log(this.TAG, 'Flv: Invalid video packet, missing VideoData payload!');
      return;
    }

    if (this._hasVideoFlagOverrided === true && this._hasVideo === false) {
      // If hasVideo: false indicated explicitly in MediaDataSource,
      // Ignore all the video packets
      return;
    }
    //视频信息1字节，前4位为帧类型，后4位为编码Id
    let array = new Uint8Array(arrayBuffer, dataOffset, dataSize)
    let spec = array[0];
    /*
    1 keyframe (for AVC, a seekable frame) 关键帧
    2 inter frame (for AVC, a non-seekable frame)
    3 disposable inter frame (H.263 only)
    4 generated keyframe (reserved for server use only)
    5 video info/command frame
     */
    let frameType = (spec & 240) >>> 4;  //1
    /*
    1 JPEG (currently unused)
    2 Sorenson H.263
    3 Screen video
    4 On2 VP6
    5 On2 VP6 with alpha channel
    6 Screen video version 2
    7 AVC  (H.264)
    */
    let codecId = spec & 15; 
    if (codecId != 7) {
      this.observer.trigger(Event.ERROR, { type: ErrorTypes.MEDIA_ERROR, 'reason':`Flv: Unsupported codec in video frame: ${codecId}` } );
      //this._onError(DemuxErrors.CODEC_UNSUPPORTED, `Flv: Unsupported codec in video frame: ${codecId}`);
      return;
    }
    console.log("spec", spec)
    console.log("codecId", codecId)
    this._parseAVCVideoPacket(arrayBuffer, dataOffset + 1, dataSize - 1, tagTimestamp, tagPosition, frameType);
    
  }

  _parseAVCVideoPacket( arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition, frameType ){
    if (dataSize < 4) {
      window.debug && window.console.log(this.TAG, 'Flv: Invalid AVC packet, missing AVCPacketType or/and CompositionTime');
      return;
    }
    let le = this._littleEndian;
    let v = new DataView(arrayBuffer, dataOffset, dataSize);

    //AVCPackType
    /*
    0 AVCDecoderConfigurationRecord(AVC sequence header)
    1 AVC NALU
    2 AVC end of sequence (lower level NALU sequence ender is not required or supported)
     */
    let packetType = v.getUint8(0);
    let cts_unsigned = v.getUint32(0, !le) & 0x00FFFFFF;
    let cts = (cts_unsigned << 8) >> 8;  // convert to 24-bit signed int
    console.log("AVCPackType:", packetType, "cts", cts)
    if (packetType === 0) {  // AVCDecoderConfigurationRecord
      this._parseAVCDecoderConfigurationRecord(arrayBuffer, dataOffset + 4, dataSize - 4);
    } else if (packetType === 1) {  // One or more Nalus
      this._parseAVCVideoData(arrayBuffer, dataOffset + 4, dataSize - 4, tagTimestamp, tagPosition, frameType, cts);
    } else if (packetType === 2) {
      // empty, AVC end of sequence
    } else {
      //this._onError(DemuxErrors.FORMAT_ERROR, `Flv: Invalid video packet type ${packetType}`);
      return;
    }
    
  }
  _parseAVCDecoderConfigurationRecord( arrayBuffer, dataOffset, dataSize ){
    if (dataSize < 7) {
      window.debug && window.console.log(this.TAG, 'Flv: Invalid AVCDecoderConfigurationRecord, lack of data!');
      return;
    }
    let meta = this._videoMetadata;
    let track = this._videoTrack;
    let le = this._littleEndian;
    let v = new DataView(arrayBuffer, dataOffset, dataSize);

    if (!meta) {
      if (this._hasVideo === false ) {
        this._hasVideo = true;
        this._mediaInfo.hasVideo = true;
      }
      meta = this._videoMetadata = {};
      meta.type = 'video';
      meta.id = track.id;
      meta.timescale = this._timescale;
      meta.duration = this._duration;
    } else {
      if (typeof meta.avcc !== 'undefined') {
        window.debug && window.console.log(this.TAG, 'Found another AVCDecoderConfigurationRecord!');
      }
    }

    let version = v.getUint8(0);  // configurationVersion
    let avcProfile = v.getUint8(1);  // avcProfileIndication
    let profileCompatibility = v.getUint8(2);  // profile_compatibility
    let avcLevel = v.getUint8(3);  // AVCLevelIndication
    console.log("configurationVersion", version, "avcProfileIndication", avcProfile)

    if (version !== 1 || avcProfile === 0) {
      //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: Invalid AVCDecoderConfigurationRecord');
      return;
    }

    this._naluLengthSize = (v.getUint8(4) & 3) + 1;  // lengthSizeMinusOne
    if (this._naluLengthSize !== 3 && this._naluLengthSize !== 4) {  // holy shit!!!
      //this._onError(DemuxErrors.FORMAT_ERROR, `Flv: Strange NaluLengthSizeMinusOne: ${this._naluLengthSize - 1}`);
      return;
    }

    let spsCount = v.getUint8(5) & 31;  // numOfSequenceParameterSets
    if (spsCount === 0) {
      //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: Invalid AVCDecoderConfigurationRecord: No SPS');
      return;
    } else if (spsCount > 1) {
      window.debug && window.console.log(this.TAG, `Flv: Strange AVCDecoderConfigurationRecord: SPS Count = ${spsCount}`);
    }

    let offset = 6;
    console.log("SPS Count", spsCount)
    for (let i = 0; i < spsCount; i++) {
      let len = v.getUint16(offset, !le);  // sequenceParameterSetLength
      offset += 2;

      if (len === 0) {
          continue;
      }

      // Notice: Nalu without startcode header (00 00 00 01)
      let sps = new Uint8Array(arrayBuffer, dataOffset + offset, len);
      track.sps = [sps];
      offset += len;
      console.log("sps", sps)
      let config = SPSParser.parseSPS(sps);
      if (i !== 0) {
          // ignore other sps's config
          continue;
      }

      meta.codecWidth = config.codec_size.width;
      meta.codecHeight = config.codec_size.height;
      meta.presentWidth = config.present_size.width;
      meta.presentHeight = config.present_size.height;

      meta.profile = config.profile_string;
      meta.level = config.level_string;
      meta.bitDepth = config.bit_depth;
      meta.chromaFormat = config.chroma_format;
      meta.sarRatio = config.sar_ratio;
      meta.frameRate = config.frame_rate;

      if (config.frame_rate.fixed === false ||
          config.frame_rate.fps_num === 0 ||
          config.frame_rate.fps_den === 0) {
          meta.frameRate = this._referenceFrameRate;
      }

      let fps_den = meta.frameRate.fps_den;
      let fps_num = meta.frameRate.fps_num;
      meta.refSampleDuration = meta.timescale * (fps_den / fps_num);

      let codecArray = sps.subarray(1, 4);
      let codecString = 'avc1.';
      for (let j = 0; j < 3; j++) {
          let h = codecArray[j].toString(16);
          if (h.length < 2) {
              h = '0' + h;
          }
          codecString += h;
      }
      meta.codec = codecString;

      let mi = this._mediaInfo;
      mi.width = meta.codecWidth;
      mi.height = meta.codecHeight;
      mi.fps = meta.frameRate.fps;
      mi.profile = meta.profile;
      mi.level = meta.level;
      mi.refFrames = config.ref_frames;
      mi.chromaFormat = config.chroma_format_string;
      mi.sarNum = meta.sarRatio.width;
      mi.sarDen = meta.sarRatio.height;
      mi.videoCodec = codecString;

      //add by wangxk
      track.width = meta.codecWidth;
      track.height = meta.codecHeight;
      track.codec = codecString;
      track.duration = meta.duration;
      track.pixelRatio = [ meta.sarRatio.width, meta.sarRatio.height ] 
      if (mi.hasAudio) {
        if (mi.audioCodec != null) {
            mi.mimeType = 'video/x-flv; codecs="' + mi.videoCodec + ',' + mi.audioCodec + '"';
        }
      } else {
        mi.mimeType = 'video/x-flv; codecs="' + mi.videoCodec + '"';
      }
      if (mi.isComplete()) {
        this._onMediaInfo(mi);
      }
    }

    let ppsCount = v.getUint8(offset);  // numOfPictureParameterSets
    console.log("PPS Count", ppsCount)
    if (ppsCount === 0) {
      //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: Invalid AVCDecoderConfigurationRecord: No PPS');
      return;
    } else if (ppsCount > 1) {
      window.debug && window.console.log(this.TAG, `Flv: Strange AVCDecoderConfigurationRecord: PPS Count = ${ppsCount}`);
    }

    offset++;

    for (let i = 0; i < ppsCount; i++) {
        let len = v.getUint16(offset, !le);  // pictureParameterSetLength
        offset += 2;

        if (len === 0) {
            continue;
        }

        // pps is useless for extracting video information
        let pps = new Uint8Array(arrayBuffer, dataOffset + offset, len);
        //
        track.pps = [pps];
        offset += len;
    }

    //debugger;
    meta.avcc = new Uint8Array(dataSize);
    meta.avcc.set(new Uint8Array(arrayBuffer, dataOffset, dataSize), 0);
    window.debug && window.console.log(this.TAG, 'Parsed AVCDecoderConfigurationRecord');

    
    if (this._isInitialMetadataDispatched()) {
      console.log("_isInitialMetadataDispatched....");
      // flush parsed frames
      if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) {
        this._onDataAvailable(this._audioTrack, this._videoTrack);
      }
    } else {
      console.log("video metadata init......")
        this._videoInitialMetadataDispatched = true;
    }
    debugger;
    // notify new metadata    
    this._dispatch = false;
    this._onTrackMetadata('video', meta);
  }

  _parseAVCVideoData(arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition, frameType, cts) {
    let le = this._littleEndian;
    let v = new DataView(arrayBuffer, dataOffset, dataSize);

    let units = [], length = 0;

    let offset = 0;
    const lengthSize = this._naluLengthSize;
    let dts = this._timestampBase + tagTimestamp;
    console.log("DTS===============", dts, tagTimestamp)
    //add by wangxk
    let keyframe = (frameType === 1);  // from FLV Frame Type constants

    while (offset < dataSize) {
      if (offset + 4 >= dataSize) {
          window.debug && console.log(this.TAG, `Malformed Nalu near timestamp ${dts}, offset = ${offset}, dataSize = ${dataSize}`);
          break;  // data not enough for next Nalu
      }
      // Nalu with length-header (AVC1)
      let naluSize = v.getUint32(offset, !le);  // Big-Endian read
      if (lengthSize === 3) {
          naluSize >>>= 8;
      }
      if (naluSize > dataSize - lengthSize) {
          window.debug && console.log(this.TAG, `Malformed Nalus near timestamp ${dts}, NaluSize > DataSize!`);
          return;
      }

      let unitType = v.getUint8(offset + lengthSize) & 0x1F;

      if (unitType === 5) {  // IDR
          keyframe = true;
      }

      let data = new Uint8Array(arrayBuffer, dataOffset + offset, lengthSize + naluSize);
      let unit = {type: unitType, data: data};
      units.push(unit);
      length += data.byteLength;

      offset += lengthSize + naluSize;
    }

    if (units.length) {
      let track = this._videoTrack;
      let avcSample = {
          units: units,
          length: length,
          isKeyframe: keyframe,
          dts: dts,
          cts: cts,
          pts: (dts + cts)
      };
      if (keyframe) {
          avcSample.fileposition = tagPosition;
      }
      track.samples.push(avcSample);
      track.length += length;
    }
    console.log("AVCVideo:", this._videoTrack)
  }

  _parseAudioData(arrayBuffer, dataOffset, dataSize, tagTimestamp) {
    if (dataSize <= 1) {
      window.debug && console.log(this.TAG, 'Flv: Invalid audio packet, missing SoundData payload!');
      return;
    }
    if (this._hasAudioFlagOverrided === true && this._hasAudio === false) {
      // If hasAudio: false indicated explicitly in MediaDataSource,
      // Ignore all the audio packets
      return;
    }
    let v = new DataView(arrayBuffer, dataOffset, dataSize);
    let soundSpec = v.getUint8(0);
    let le = this._littleEndian;
    
    let soundFormat = soundSpec >>> 4;
    if (soundFormat !== 2 && soundFormat !== 10) {  // MP3 or AAC
        //this._onError(DemuxErrors.CODEC_UNSUPPORTED, 'Flv: Unsupported audio codec idx: ' + soundFormat);
        return;
    }

    let soundRate = 0;
    let soundRateIndex = (soundSpec & 12) >>> 2;
    if (soundRateIndex >= 0 && soundRateIndex <= 4) {
        soundRate = this._flvSoundRateTable[soundRateIndex];
    } else {
        //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: Invalid audio sample rate idx: ' + soundRateIndex);
        return;
    }

    let soundSize = (soundSpec & 2) >>> 1;  // unused
    let soundType = (soundSpec & 1);
    let meta = this._audioMetadata;
    let track = this._audioTrack;

    if (!meta) {
      if (this._hasAudio === false ) {
          this._hasAudio = true;
          this._mediaInfo.hasAudio = true;
      }

      // initial metadata
      meta = this._audioMetadata = {};
      meta.type = 'audio';
      meta.id = track.id;
      meta.timescale = this._timescale;
      meta.duration = this._duration;
      meta.audioSampleRate = soundRate;
      meta.channelCount = (soundType === 0 ? 1 : 2);
    }

    console.log("音频格式:", soundFormat)
    if (soundFormat === 10) {  // AAC
      track.isAAC = true;
      let aacData = this._parseAACAudioData(arrayBuffer, dataOffset + 1, dataSize - 1);
      if (aacData == undefined) {
          return;
      }

      if (aacData.packetType === 0) {  // AAC sequence header (AudioSpecificConfig)
        if (meta.config) {
          window.debug && console.log(this.TAG, 'Found another AudioSpecificConfig!');
        }
        let misc = aacData.data;
        meta.audioSampleRate = misc.samplingRate;

        //add by wangxk
        track.samplerate = misc.samplingRate;
        track.config = misc.config;
        //add by wangxk
        track.codec = misc.codec;
        track.duration = meta.duration;
        track.channelCount = meta.channelCount;

        meta.channelCount = misc.channelCount;
        meta.codec = misc.codec;
        meta.originalCodec = misc.originalCodec;
        meta.config = misc.config;
        // The decode result of an aac sample is 1024 PCM samples
        meta.refSampleDuration = 1024 / meta.audioSampleRate * meta.timescale;
        window.debug && console.log(this.TAG, 'Parsed AudioSpecificConfig');

        
        if (this._isInitialMetadataDispatched()) {
            // Non-initial metadata, force dispatch (or flush) parsed frames to remuxer
            if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) {
                this._onDataAvailable(this._audioTrack, this._videoTrack);
            }
        } else {
          console.log("audio metadata init......")
            this._audioInitialMetadataDispatched = true;
        }
        
        // then notify new metadata
        this._dispatch = false;
        this._onTrackMetadata('audio', meta);

        let mi = this._mediaInfo;
        mi.audioCodec = meta.originalCodec;
        mi.audioSampleRate = meta.audioSampleRate;
        mi.audioChannelCount = meta.channelCount;
        if (mi.hasVideo) {
          if (mi.videoCodec != null) {
            mi.mimeType = 'video/x-flv; codecs="' + mi.videoCodec + ',' + mi.audioCodec + '"';
          }
        } else {
          mi.mimeType = 'video/x-flv; codecs="' + mi.audioCodec + '"';
        }
        if (mi.isComplete()) {
          this._onMediaInfo(mi);
        }
      } else if (aacData.packetType === 1) {  // AAC raw frame data
        let dts = this._timestampBase + tagTimestamp;
        let aacSample = {unit: aacData.data, length: aacData.data.byteLength, dts: dts, pts: dts};
        track.samples.push(aacSample);
        track.length += aacData.data.length;
      } else {
        window.debug && console.log(this.TAG, `Flv: Unsupported AAC data type ${aacData.packetType}`);
      }
    } else if (soundFormat === 2) {  // MP3
      if (!meta.codec) {
        // We need metadata for mp3 audio track, extract info from frame header
        let misc = this._parseMP3AudioData(arrayBuffer, dataOffset + 1, dataSize - 1, true);
        if (misc == undefined) {
            return;
        }
        meta.audioSampleRate = misc.samplingRate;
        meta.channelCount = misc.channelCount;
        meta.codec = misc.codec;
        meta.originalCodec = misc.originalCodec;
        // The decode result of an mp3 sample is 1152 PCM samples
        meta.refSampleDuration = 1152 / meta.audioSampleRate * meta.timescale;
        window.debug && console.log(this.TAG, 'Parsed MPEG Audio Frame Header');

        this._audioInitialMetadataDispatched = true;
        this._onTrackMetadata('audio', meta);

        let mi = this._mediaInfo;
        mi.audioCodec = meta.codec;
        mi.audioSampleRate = meta.audioSampleRate;
        mi.audioChannelCount = meta.channelCount;
        mi.audioDataRate = misc.bitRate;

        //add by wangxk
        track.codec = meta.codec;

        if (mi.hasVideo) {
            if (mi.videoCodec != null) {
                mi.mimeType = 'video/x-flv; codecs="' + mi.videoCodec + ',' + mi.audioCodec + '"';
            }
        } else {
            mi.mimeType = 'video/x-flv; codecs="' + mi.audioCodec + '"';
        }
        if (mi.isComplete()) {
            this._onMediaInfo(mi);
        }
      }

      // This packet is always a valid audio packet, extract it
      let data = this._parseMP3AudioData(arrayBuffer, dataOffset + 1, dataSize - 1, false);
      if (data == undefined) {
          return;
      }

      //pts：显示时间，也就是接收方在显示器显示这帧的时间。单位为1/90000 秒
      //dts：解码时间，也就是rtp包中传输的时间戳，表明解码的顺序。单位单位为1/90000 秒
      //cts:偏移：cts = (pts - dts) / 90 。cts的单位是毫秒。
      let dts = this._timestampBase + tagTimestamp;
      let mp3Sample = {unit: data, length: data.byteLength, dts: dts, pts: dts};



      track.samples.push(mp3Sample);
      track.length += data.length;
    }
  }

  _parseAACAudioData(arrayBuffer, dataOffset, dataSize) {
        if (dataSize <= 1) {
            window.debug && console.log(this.TAG, 'Flv: Invalid AAC packet, missing AACPacketType or/and Data!');
            return;
        }

        let result = {};
        let array = new Uint8Array(arrayBuffer, dataOffset, dataSize);

        result.packetType = array[0];

        if (array[0] === 0) {
            result.data = this._parseAACAudioSpecificConfig(arrayBuffer, dataOffset + 1, dataSize - 1);
        } else {
            result.data = array.subarray(1);
        }

        return result;
    }

    _parseAACAudioSpecificConfig(arrayBuffer, dataOffset, dataSize) {
        let array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
        let config = null;

        /* Audio Object Type:
           0: Null
           1: AAC Main
           2: AAC LC
           3: AAC SSR (Scalable Sample Rate)
           4: AAC LTP (Long Term Prediction)
           5: HE-AAC / SBR (Spectral Band Replication)
           6: AAC Scalable
        */

        let audioObjectType = 0;
        let originalAudioObjectType = 0;
        let audioExtensionObjectType = null;
        let samplingIndex = 0;
        let extensionSamplingIndex = null;

        // 5 bits
        audioObjectType = originalAudioObjectType = array[0] >>> 3;
        // 4 bits
        samplingIndex = ((array[0] & 0x07) << 1) | (array[1] >>> 7);
        if (samplingIndex < 0 || samplingIndex >= this._mpegSamplingRates.length) {
            //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: AAC invalid sampling frequency index!');
            return;
        }

        let samplingFrequence = this._mpegSamplingRates[samplingIndex];

        // 4 bits
        let channelConfig = (array[1] & 0x78) >>> 3;
        if (channelConfig < 0 || channelConfig >= 8) {
            //this._onError(DemuxErrors.FORMAT_ERROR, 'Flv: AAC invalid channel configuration');
            return;
        }

        if (audioObjectType === 5) {  // HE-AAC?
            // 4 bits
            extensionSamplingIndex = ((array[1] & 0x07) << 1) | (array[2] >>> 7);
            // 5 bits
            audioExtensionObjectType = (array[2] & 0x7C) >>> 2;
        }

        // workarounds for various browsers
        let userAgent = self.navigator.userAgent.toLowerCase();

        if (userAgent.indexOf('firefox') !== -1) {
            // firefox: use SBR (HE-AAC) if freq less than 24kHz
            if (samplingIndex >= 6) {
                audioObjectType = 5;
                config = new Array(4);
                extensionSamplingIndex = samplingIndex - 3;
            } else {  // use LC-AAC
                audioObjectType = 2;
                config = new Array(2);
                extensionSamplingIndex = samplingIndex;
            }
        } else if (userAgent.indexOf('android') !== -1) {
            // android: always use LC-AAC
            audioObjectType = 2;
            config = new Array(2);
            extensionSamplingIndex = samplingIndex;
        } else {
            // for other browsers, e.g. chrome...
            // Always use HE-AAC to make it easier to switch aac codec profile
            audioObjectType = 5;
            extensionSamplingIndex = samplingIndex;
            config = new Array(4);

            if (samplingIndex >= 6) {
                extensionSamplingIndex = samplingIndex - 3;
            } else if (channelConfig === 1) {  // Mono channel
                audioObjectType = 2;
                config = new Array(2);
                extensionSamplingIndex = samplingIndex;
            }
        }

        config[0]  = audioObjectType << 3;
        config[0] |= (samplingIndex & 0x0F) >>> 1;
        config[1]  = (samplingIndex & 0x0F) << 7;
        config[1] |= (channelConfig & 0x0F) << 3;
        if (audioObjectType === 5) {
            config[1] |= ((extensionSamplingIndex & 0x0F) >>> 1);
            config[2]  = (extensionSamplingIndex & 0x01) << 7;
            // extended audio object type: force to 2 (LC-AAC)
            config[2] |= (2 << 2);
            config[3]  = 0;
        }

        return {
            config: config,
            samplingRate: samplingFrequence,
            channelCount: channelConfig,
            codec: 'mp4a.40.' + audioObjectType,
            originalCodec: 'mp4a.40.' + originalAudioObjectType
        };
    }

    _parseMP3AudioData(arrayBuffer, dataOffset, dataSize, requestHeader) {
      if (dataSize < 4) {
          window.debug && console.log(this.TAG, 'Flv: Invalid MP3 packet, header missing!');
          return;
      }

      let le = this._littleEndian;
      let array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
      let result = null;

      if (requestHeader) {
          if (array[0] !== 0xFF) {
              return;
          }
          let ver = (array[1] >>> 3) & 0x03;
          let layer = (array[1] & 0x06) >> 1;

          let bitrate_index = (array[2] & 0xF0) >>> 4;
          let sampling_freq_index = (array[2] & 0x0C) >>> 2;

          let channel_mode = (array[3] >>> 6) & 0x03;
          let channel_count = channel_mode !== 3 ? 2 : 1;

          let sample_rate = 0;
          let bit_rate = 0;
          let object_type = 34;  // Layer-3, listed in MPEG-4 Audio Object Types

          let codec = 'mp3';

          switch (ver) {
              case 0:  // MPEG 2.5
                  sample_rate = this._mpegAudioV25SampleRateTable[sampling_freq_index];
                  break;
              case 2:  // MPEG 2
                  sample_rate = this._mpegAudioV20SampleRateTable[sampling_freq_index];
                  break;
              case 3:  // MPEG 1
                  sample_rate = this._mpegAudioV10SampleRateTable[sampling_freq_index];
                  break;
          }

          switch (layer) {
              case 1:  // Layer 3
                  object_type = 34;
                  if (bitrate_index < this._mpegAudioL3BitRateTable.length) {
                      bit_rate = this._mpegAudioL3BitRateTable[bitrate_index];
                  }
                  break;
              case 2:  // Layer 2
                  object_type = 33;
                  if (bitrate_index < this._mpegAudioL2BitRateTable.length) {
                      bit_rate = this._mpegAudioL2BitRateTable[bitrate_index];
                  }
                  break;
              case 3:  // Layer 1
                  object_type = 32;
                  if (bitrate_index < this._mpegAudioL1BitRateTable.length) {
                      bit_rate = this._mpegAudioL1BitRateTable[bitrate_index];
                  }
                  break;
          }

          result = {
              bitRate: bit_rate,
              samplingRate: sample_rate,
              channelCount: channel_count,
              codec: codec,
              originalCodec: codec
          };
      } else {
          result = array;
      }
      return result;
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