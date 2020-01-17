import {ErrorTypes} from '../../const/Errors';
import urls from '@/lib/core/urls'

let LevelInfo = function(){
    this.endSN =0,//最后一条记录的序号
    this.fragments = [], // M3U8Fragment
    this.live = false,
    this.startSN =0,
    this.targetduration =1,
    this.totalduration = 1,
    this.url = "" //m3u8地址
}
/**
 *  M3U8Fragment
 *  {
 *      byteRangeEndOffset: undefined
 *      byteRangeStartOffset: undefined
 *      cc: 0
 *      decryptdata: {method: null, key: null, iv: null, uri: null}
 *      duration: 6.066667
 *      idx: 0
 *      level: 0
 *      sn: 0
 *      start: 0
 *      url: "http://web.fun.tv/demo/ts2/400k00000.ts"
 *  }
 *  
 */

let M3U8Fragment = function(){
    this.byteRangeStartOffset = 0;
    this.byteRangeEndOffset = 0;
    this.cc = 0; //??
    this.decryptdata = {method: null, key: null, iv: null, uri: null}
    this.duration = 0;
    this.idx = 0; //序号
    this.level = 0; //所属清晰度级别
    this.sn = 0;
    this.start = 0;//开始时间
    this.url = ""; //碎片数据地址
}

class M3U8Parser{

    /** 
     * 解析内容
     * @param {string} string 内容文本
     * @param {string} 基本地址
     * @param {int} id=0 清晰度级别
     */
    parseLevelPlaylist( string, url, id ){
        var baseurl = url;

        var currentSN = 0,
        totalduration = 0,
        level = {
            url: baseurl,
            fragments: [],
            live: true,
            startSN: 0
        },
        result,
        regexp,
        cc = 0,
        frag,
        byteRangeEndOffset,
        byteRangeStartOffset;
        var levelkey = {
            method: null,
            key: null,
            iv: null,
            uri: null
        };
        //regexp = /(?:#EXT-X-(MEDIA-SEQUENCE):(\d+))|(?:#EXT-X-(TARGETDURATION):(\d+))|(?:#EXT-X-(KEY):(.*))|(?:#EXT(INF):([\d\.]+)[^\r\n]*([\r\n]+[^#|\r\n]+)?)|(?:#EXT-X-(BYTERANGE):([\d]+[@[\d]*)]*[\r\n]+([^#|\r\n]+)?|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DIS)CONTINUITY))/g;
        regexp = /(?:#EXT-X-(MEDIA-SEQUENCE):(\d+))|(?:#EXT-X-(TARGETDURATION):(\d+))|(?:#EXT-X-(KEY):(.*))|(?:#EXT(INF):([\d\.]+)[^\r\n]*(([\r\n]#[^#|\r\n]*)*)([\r\n]+[^#|\r\n]+)?)|(?:#EXT-X-(BYTERANGE):([\d]+[@[\d]*)]*[\r\n]+([^#|\r\n]+)?|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DIS)CONTINUITY))/g;
        var idx = 0;
        while ((result = regexp.exec(string)) !== null) {
            result.shift();
            result = result.filter(function(n) {
                return n !== undefined;
            });
            switch (result[0]) {
            case 'MEDIA-SEQUENCE':
                currentSN = level.startSN = parseInt(result[1]);
                break;
            case 'TARGETDURATION':
                level.targetduration = parseFloat(result[1]);
                break;
            case 'ENDLIST':
                level.live = false;
                break;
            case 'DIS':
                cc++;
                break;
            case 'BYTERANGE':
                var params = result[1].split('@');
                if (params.length === 1) {
                    byteRangeStartOffset = byteRangeEndOffset;
                } else {
                    byteRangeStartOffset = parseInt(params[1]);
                }
                byteRangeEndOffset = parseInt(params[0]) + byteRangeStartOffset;
                frag = level.fragments.length ? level.fragments[level.fragments.length - 1] : null;
                if (frag && !frag.url) {
                    frag.byteRangeStartOffset = byteRangeStartOffset;
                    frag.byteRangeEndOffset = byteRangeEndOffset;
                    frag.url = urls.resolve(result[2], baseurl);
                }
                break;
            case 'INF':
                var duration = parseFloat(result[1]);
                if (!isNaN(duration)) {
                    var fragdecryptdata, sn = currentSN++;
                    if (levelkey.method && levelkey.uri && !levelkey.iv) {
                        fragdecryptdata = this.cloneObj(levelkey);
                        var uint8View = new Uint8Array(16);
                        for (var i = 12; i < 16; i++) {
                            uint8View[i] = sn >> 8 * (15 - i) & 0xff;
                        }
                        fragdecryptdata.iv = uint8View;
                    } else {
                        fragdecryptdata = levelkey;
                    }
                    level.fragments.push({
                        //url: result[2] ? urls.resolve(result[2], baseurl) : null,
                        url: result[2] ? (result[4] ? urls.resolve(result[4], baseurl) : null) : (result[3] ? urls.resolve(result[3], baseurl) : null),
                        duration: duration,
                        start: totalduration,
                        sn: sn,
                        idx:idx,
                        level: id,
                        cc: cc,
                        byteRangeStartOffset: byteRangeStartOffset,
                        byteRangeEndOffset: byteRangeEndOffset,
                        decryptdata: fragdecryptdata
                    });
                    totalduration += duration;
                    byteRangeStartOffset = null;
                    idx ++;
                }
                break;
            case 'KEY':
                // https://tools.ietf.org/html/draft-pantos-http-live-streaming-08#section-3.4.4
                var decryptparams = result[1];
                var decryptmethod = this.parseKeyParamsByRegex(decryptparams, /(METHOD)=([^,]*)/),
                decrypturi = this.parseKeyParamsByRegex(decryptparams, /(URI)=["]([^,]*)["]/),
                decryptiv = this.parseKeyParamsByRegex(decryptparams, /(IV)=([^,]*)/);
                if (decryptmethod) {
                    levelkey = {
                        method: null,
                        key: null,
                        iv: null,
                        uri: null
                    };
                    if (decrypturi && decryptmethod === 'AES-128') {
                        levelkey.method = decryptmethod;
                        // URI to get the key
                        levelkey.uri = urls.resolve(decrypturi, baseurl);
                        levelkey.key = null;
                        // Initialization Vector (IV)
                        if (decryptiv) {
                            levelkey.iv = decryptiv;
                            if (levelkey.iv.substring(0, 2) === '0x') {
                                levelkey.iv = levelkey.iv.substring(2);
                            }
                            levelkey.iv = levelkey.iv.match(/.{8}/g);
                            levelkey.iv[0] = parseInt(levelkey.iv[0], 16);
                            levelkey.iv[1] = parseInt(levelkey.iv[1], 16);
                            levelkey.iv[2] = parseInt(levelkey.iv[2], 16);
                            levelkey.iv[3] = parseInt(levelkey.iv[3], 16);
                            levelkey.iv = new Uint32Array(levelkey.iv);
                        }
                    }
                }
                break;
            default:
                break;
            }
        }
        //logger.log('found ' + level.fragments.length + ' fragments');
        level.totalduration = totalduration;
        level.endSN = currentSN - 1;
        return level;
    }

    avc1toavcoti(codec){
        var result, avcdata = codec.split('.');
        if (avcdata.length > 2) {
            result = avcdata.shift() + '.';
            result += parseInt(avcdata.shift()).toString(16);
            result += ('000' + parseInt(avcdata.shift()).toString(16)).substr( - 4);
        } else {
            result = codec;
        }
        return result;
    }

    parseMasterPlaylist( string, url ){
        var levels = [],
        level = {},
        result,
        codecs,
        codec;
        // https://regex101.com is your friend
        var re = /#EXT-X-STREAM-INF:([^\n\r]*(BAND)WIDTH=(\d+))?([^\n\r]*(CODECS)=\"([^\"\n\r]*)\",?)?([^\n\r]*(RES)OLUTION=(\d+)x(\d+))?([^\n\r]*(NAME)=\"(.*)\")?[^\n\r]*[\r\n]+([^\r\n]+)/g;
        while ((result = re.exec(string)) != null) {
            result.shift();
            result = result.filter(function(n) {
                return n !== undefined;
            });
            level.url = urls.resolve(result.pop(), baseurl);
            while (result.length > 0) {
                switch (result.shift()) {
                case 'RES':
                    level.width = parseInt(result.shift());
                    level.height = parseInt(result.shift());
                    break;
                case 'BAND':
                    level.bitrate = parseInt(result.shift());
                    break;
                case 'NAME':
                    level.name = result.shift();
                    break;
                case 'CODECS':
                    codecs = result.shift().split(',');
                    while (codecs.length > 0) {
                        codec = codecs.shift();
                        if (codec.indexOf('avc1') !== -1) {
                            level.videoCodec = this.avc1toavcoti(codec);
                        } else {
                            level.audioCodec = codec;
                        }
                    }
                    break;
                default:
                    break;
                }
            }
            levels.push(level);
            level = {};
        }
        return levels;
    }

    parse( string, url ){
        let baseurl = url;
        if (string.indexOf('#EXTM3U') === 0) {
            if (string.indexOf('#EXTINF:') > 0) {
                var levelDetails = this.parseLevelPlaylist(string, url, 0);
                return {
                    levels:[{
                        details:levelDetails,
                        level:0,
                        id:0
                        }
                    ]
                };
            } else {
                levels = this.parseMasterPlaylist(string, url);
                // multi level playlist, parse level info
                if (levels.length) {
                    return {
                        levels:levels, 
                        url:url
                    }
                } else {
                    throw new Error({type:'error',message:'level error'})
                    //throw new Error("level error.");
                }
            }
        } else {
            throw new Error({type:'error',code: ErrorTypes.NETWORK_DATA ,message:'no EXTM3U delimiter'})
            /*
            hls.trigger(_events2['default'].ERROR, {
                type: _errors.ErrorTypes.NETWORK_ERROR,
                details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR,
                fatal: true,
                url: url,
                reason: 'no EXTM3U delimiter'
            });
            */
        }
    }
}
export default M3U8Parser;