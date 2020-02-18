import urls from '@/lib/core/urls'
import { sampleEntryCodesISO } from '../../const/codecs'
import AttrList from './AttrList'

let Fragment = function(){
	this.cross = true; //默认是跨域块
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
    this.tagList = [];
    this.type = '';//VOD,EVENT
}



// https://regex101.com is your friend
const MASTER_PLAYLIST_REGEX = /#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)/g;
const MASTER_PLAYLIST_MEDIA_REGEX = /#EXT-X-MEDIA:(.*)/g;

const LEVEL_PLAYLIST_REGEX_FAST = new RegExp([
  /#EXTINF:\s*(\d*(?:\.\d+)?)(?:,(.*)\s+)?/.source, // duration (#EXTINF:<duration>,<title>), group 1 => duration, group 2 => title
  /|(?!#)(\S+)/.source, // segment URI, group 3 => the URI (note newline is not eaten)
  /|#EXT-X-BYTERANGE:*(.+)/.source, // next segment's byterange, group 4 => range spec (x@y)
  /|#EXT-X-PROGRAM-DATE-TIME:(.+)/.source, // next segment's program date/time group 5 => the datetime spec
  /|#.*/.source // All other non-segment oriented tags will match with all groups empty
].join(''), 'g');

const LEVEL_PLAYLIST_REGEX_SLOW = /(?:(?:#(EXTM3U))|(?:#EXT-X-(PLAYLIST-TYPE):(.+))|(?:#EXT-X-(MEDIA-SEQUENCE): *(\d+))|(?:#EXT-X-(TARGETDURATION): *(\d+))|(?:#EXT-X-(KEY):(.+))|(?:#EXT-X-(START):(.+))|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DISCONTINUITY-SEQ)UENCE:(\d+))|(?:#EXT-X-(DIS)CONTINUITY))|(?:#EXT-X-(VERSION):(\d+))|(?:#EXT-X-(MAP):(.+))|(?:(#)(.*):(.*))|(?:(#)(.*))(?:.*)\r?\n?/;

const MP4_REGEX_SUFFIX = /\.(mp4|m4s|m4v|m4a)$/i;

class M3U8Parser{

	static isCodecType( codec, type ){
		const typeCodes = sampleEntryCodesISO[type];
  		return !!typeCodes && typeCodes[codec.slice(0, 4)] === true;
	}

	static convertAVC1ToAVCOTI (codec) {
		let result, avcdata = codec.split('.');
		if (avcdata.length > 2) {
			result = avcdata.shift() + '.';
			result += parseInt(avcdata.shift()).toString(16);
			result += ('000' + parseInt(avcdata.shift()).toString(16)).substr(-4);
		} else {
			result = codec;
		}
		return result;
	}

	parseMasterPlaylist( string, url ){
		let baseurl = url;
		let levels = [], result;
	    MASTER_PLAYLIST_REGEX.lastIndex = 0;

	    function setCodecs (codecs, level) {
	      	['video', 'audio'].forEach((type) => {
				const filtered = codecs.filter((codec) => M3U8Parser.isCodecType(codec, type));
				if (filtered.length) {
					const preferred = filtered.filter((codec) => {
					return codec.lastIndexOf('avc1', 0) === 0 || codec.lastIndexOf('mp4a', 0) === 0;
					});
					level[`${type}Codec`] = preferred.length > 0 ? preferred[0] : filtered[0];

					// remove from list
					codecs = codecs.filter((codec) => filtered.indexOf(codec) === -1);
	        	}
	      	});

	      level.unknownCodecs = codecs;
	    }

	    while ((result = MASTER_PLAYLIST_REGEX.exec(string)) != null) {
			const level = {};

			const attrs = level.attrs = new AttrList(result[1]);
			level.url = urls.resolve(baseurl, result[2]);
			const resolution = attrs.decimalResolution('RESOLUTION');
			if (resolution) {
				level.width = resolution.width;
				level.height = resolution.height;
			}
			level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
			level.name = attrs.NAME;

			setCodecs([].concat((attrs.CODECS || '').split(/[ ,]+/)), level);

			if (level.videoCodec && level.videoCodec.indexOf('avc1') !== -1) {
				level.videoCodec = M3U8Parser.convertAVC1ToAVCOTI(level.videoCodec);
			}

			levels.push(level);
	    }
	    return levels
	}
	parseLevelPlaylist( string, url, id ){
		let baseurl = url;
		let currentSN = 0,
			totalduration = 0,
			level = { type: null, version: null, url: baseurl, fragments: [], live: true, startSN: 0 },
			//levelkey = new LevelKey(),
			levelkey = {},
			levelUrlId = 0,
			cc = 0,
			prevFrag = null,
			frag = new Fragment(),
			result,
			type ="",
			i;

		LEVEL_PLAYLIST_REGEX_FAST.lastIndex = 0;

		while ((result = LEVEL_PLAYLIST_REGEX_FAST.exec(string)) !== null) {
			const duration = result[1];
			if (duration) { // INF
				frag.duration = parseFloat(duration);
				// avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
				const title = (' ' + result[2]).slice(1);
				frag.title = title || null;
				frag.tagList.push(title ? [ 'INF', duration, title ] : [ 'INF', duration ]);
			} else if (result[3]) { // url
				if (!isNaN(frag.duration)) {
					const sn = currentSN++;
					frag.type = type;
					frag.start = totalduration;
					frag.levelkey = levelkey;
					frag.sn = sn;
					frag.level = id;
					frag.cc = cc;
					frag.urlId = levelUrlId;
					frag.baseurl = baseurl;
					// avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
					frag.url = (' ' + result[3]).slice(1);
					if( !/http/.exec( frag.url )){
						frag.url = urls.resolve( this.path, frag.url);
					}
					if (level.programDateTime) {
						if (prevFrag) {
							if (frag.rawProgramDateTime) { // PDT discontinuity found
							frag.pdt = Date.parse(frag.rawProgramDateTime);
							} else { // Contiguous fragment
							frag.pdt = prevFrag.pdt + (prevFrag.duration * 1000);
							}
						} else { // First fragment
							frag.pdt = Date.parse(level.programDateTime);
						}
						frag.endPdt = frag.pdt + (frag.duration * 1000);
					}

					level.fragments.push(frag);
					prevFrag = frag;
					totalduration += frag.duration;

					frag = new Fragment();
				}
			} else if (result[4]) { // X-BYTERANGE
				frag.rawByteRange = (' ' + result[4]).slice(1);
				if (prevFrag) {
					const lastByteRangeEndOffset = prevFrag.byteRangeEndOffset;
					if (lastByteRangeEndOffset) {
						frag.lastByteRangeEndOffset = lastByteRangeEndOffset;
					}
				}
			} else if (result[5]) { // PROGRAM-DATE-TIME
				// avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
				frag.rawProgramDateTime = (' ' + result[5]).slice(1);
				frag.tagList.push(['PROGRAM-DATE-TIME', frag.rawProgramDateTime]);
				if (level.programDateTime === undefined) {
					level.programDateTime = new Date(new Date(Date.parse(result[5])) - 1000 * totalduration);
				}
			} else {
				result = result[0].match(LEVEL_PLAYLIST_REGEX_SLOW);
				for (i = 1; i < result.length; i++) {
					if (result[i] !== undefined) {
						break;
					}
				}

				// avoid sliced strings    https://github.com/video-dev/hls.js/issues/939
				const value1 = (' ' + result[i + 1]).slice(1);
				const value2 = (' ' + result[i + 2]).slice(1);

				switch (result[i]) {
					case '#':
						frag.tagList.push(value2 ? [ value1, value2 ] : [ value1 ]);
						break;
					case 'PLAYLIST-TYPE':
						level.type = value1.toUpperCase();
						break;
					case 'MEDIA-SEQUENCE':
						currentSN = level.startSN = parseInt(value1);
						break;
					case 'TARGETDURATION':
						level.targetduration = parseFloat(value1);
						break;
					case 'VERSION':
						level.version = parseInt(value1);
						break;
					case 'EXTM3U':
						break;
					case 'ENDLIST':
						level.live = false;
						break;
					case 'DIS':
						cc++;
						frag.tagList.push(['DIS']);
						break;
					case 'DISCONTINUITY-SEQ':
						cc = parseInt(value1);
						break;
					case 'KEY':
						// https://tools.ietf.org/html/draft-pantos-http-live-streaming-08#section-3.4.4
						var decryptparams = value1;
						var keyAttrs = new AttrList(decryptparams);
						var decryptmethod = keyAttrs.enumeratedString('METHOD'),
						decrypturi = keyAttrs.URI,
						decryptiv = keyAttrs.hexadecimalInteger('IV');
						if (decryptmethod) {
							levelkey = new LevelKey();
							if ((decrypturi) && (['AES-128', 'SAMPLE-AES', 'SAMPLE-AES-CENC'].indexOf(decryptmethod) >= 0)) {
								levelkey.method = decryptmethod;
								// URI to get the key
								levelkey.baseuri = baseurl;
								levelkey.reluri = decrypturi;
								levelkey.key = null;
								// Initialization Vector (IV)
								levelkey.iv = decryptiv;
							}
						}
						break;
					case 'START':
						let startParams = value1;
						let startAttrs = new AttrList(startParams);
						let startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
						// TIME-OFFSET can be 0
						if (!isNaN(startTimeOffset)) {
							level.startTimeOffset = startTimeOffset;
						}

						break;
					case 'MAP':
						let mapAttrs = new AttrList(value1);
						frag.url = mapAttrs.URI;
						if( !/http/.exec( frag.url )){
							frag.url = this.host + frag.url;
						}
						frag.rawByteRange = mapAttrs.BYTERANGE;
						frag.baseurl = baseurl;
						frag.level = id;
						frag.type = type;
						frag.sn = 'initSegment';
						level.initSegment = frag;
						frag = new Fragment();
						break;
					default:
						console.warn(`line parsed but not handled: ${result}`);
						break;
				}
			}
		}
		frag = prevFrag;
		// logger.log('found ' + level.fragments.length + ' fragments');
		if (frag && !frag.url) {
			level.fragments.pop();
			totalduration -= frag.duration;
		}
		level.totalduration = totalduration;
		level.averagetargetduration = totalduration / level.fragments.length;
		level.endSN = currentSN - 1;
		level.startCC = level.fragments[0] ? level.fragments[0].cc : 0;
		level.endCC = cc;

		if (!level.initSegment && level.fragments.length) {
			// this is a bit lurky but HLS really has no other way to tell us
			// if the fragments are TS or MP4, except if we download them :/
			// but this is to be able to handle SIDX.
			if (level.fragments.every((frag) => MP4_REGEX_SUFFIX.test(frag.url))) {
				console.warn('MP4 fragments found but no init segment (probably no MAP, incomplete M3U8), trying to fetch SIDX');

				frag = new Fragment();
				frag.url = level.fragments[0].url;
				if( !/http/.exec( frag.url )){
					frag.url = this.host + frag.url;
				}
				frag.baseurl = baseurl;
				frag.level = id;
				frag.type = type;
				frag.sn = 'initSegment';

				level.initSegment = frag;
				level.needSidxRanges = true;
			}
		}
		return level;
    }
	parse( string, url ){
		/*	    
        if( /proxy\.php/.exec(url)){
            try{
                url = (/[\?&]url\=([^\?&]+)/i).exec(url)[1];
                url = decodeURIComponent( url )
            }catch(e){
            }
        }
        */
        let baseurl = url || location.href;
        this.host = /(https?:\/\/[^\/]+)/.exec( baseurl )[1] + "/";
        this.path = baseurl.substring(0, baseurl.lastIndexOf("/")+1);
       
        if (string.indexOf('#EXTM3U') === 0) {
            if (string.indexOf('#EXTINF:') > 0 || string.indexOf("#EXT-X-TARGETDURATION:") > 0 ) {
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
                let levels = this.parseMasterPlaylist(string, url);
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
export { M3U8Parser }