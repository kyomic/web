import AbstractStream from './AbstractStream'
import { HLSEvent, MediaEvent } from '../../event';
import { Demuxer } from './demux';
import { Loader } from '@/lib/loader'


const STATE = {
    PEDDING:"pending",

    ERROR: "error",
    STARTING: "starting",
    IDLE: "idle",
    KEY_LOADING: "key_loading",
    FRAG_LOADING: "frag_loading",
    WAITING_LEVEL: "wating_level",
    PARSING: "parseing",
    PARSED: "parsed",
    APPENDING: "appending",
    BUFFER_FLUSHING: "buffer_fulling"
}


class BufferStream extends AbstractStream{
	constructor( provider ){
		super( provider );
        this.provider = provider;
        this._state = STATE.PEDDING;
        this.evtOnProiderEvent = this.onProviderEvent.bind( this );
		this.reset();
        this.demuxer = new Demuxer( this );

        this.sourceBufferNb = 0;
        this.sourceBuffer = {}; //分为video和audio两个buffer
        this.pendingTracks = {}; //sourceBuffer未打开时的缓存tracks
    }

    onProviderEvent(evt, data){
        console.log("provider evt", evt, data)
        switch( evt.type ){
            case 'load':
                this._levels = [

                ]
                break
            case 'append':
                       
                break;
        }
    }

    reset(){
        this._levels = undefined;
        this._level = 0;

        this.sourceBuffer = {}; //分为video和audio两个buffer	

        this.media = null;  
        this.mediaSource = null;
        //mp4碎片流
        this.segments = undefined;


        this.evtOnVideoEvent = this.onVideoEvent.bind(this)
        this.evtOnDemuxEvent = this.onDemuxEvent.bind(this);

        this.evtOnMediaEvent = this.onMediaEvent.bind(this);
        this.evtOnMediaSourceEvent = this.onMediaSourceEvent.bind( this );
        this.evtOnSourceBufferEvent = this.onSourceBufferEvent.bind( this );

        this.evtOnBufferEvent = this.onBufferEvent.bind( this );


        this.attachEvent();
    }

    attachVideo(video){
        this.media = video;
        this.trigger( MediaEvent.MEDIA_ATTACHING, { media: this.media } );


    }

    attachEvent(){
       
        this.loader = new Loader();
        console.log("loader", this.loader)
        this.loader.on('data', res=>{
            this.demuxer.push( res.data.chunk, [], '','', {
                cc:0,
            } )
        })


        this.on( HLSEvent.FRAG_PARSED, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.evtOnDemuxEvent );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.evtOnDemuxEvent );

        this.on( HLSEvent.BUFFER_CODECS, this.evtOnBufferEvent )

        this.on( MediaEvent.MEDIA_ATTACHING, this.evtOnMediaEvent );
    }

    onVideoEvent( evt ){
        console.log("videoevent:", evt.type)
    }

    //video attached
    onMediaEvent( evt, data ){
        console.log("onMediaEvent", data)
        switch( evt.type ){
            case MediaEvent.MEDIA_ATTACHING:
                let media = data.media;
                // setup the media source
                var ms = this.mediaSource = new MediaSource();
                //Media Source listeners
                ms.addEventListener('sourceopen', this.evtOnMediaSourceEvent);
                ms.addEventListener('sourceended', this.evtOnMediaSourceEvent);
                ms.addEventListener('sourceclose', this.evtOnMediaSourceEvent);
                // link video and media Source
                media.src = URL.createObjectURL(ms);
                break;
        }
    }

    onBufferEvent( evt, data ){
        switch( evt.type ){
            case HLSEvent.BUFFER_CODECS:
                let tracks = data;
                // if source buffer(s) not created yet, appended buffer tracks in this.pendingTracks
                // if sourcebuffers already created, do nothing ...
                if (Object.keys(this.sourceBuffer).length === 0) {
                  for (let trackName in tracks) this.pendingTracks[trackName] = tracks[trackName];
                  let mediaSource = this.mediaSource;
                  if (mediaSource && mediaSource.readyState === 'open') {
                    // try to create sourcebuffers if mediasource opened
                    this.checkPendingTracks();
                  }
                }
                break;
        }
    }
    onDemuxEvent(  evt, data ){
        //console.log("onDemuxEvent", evt.type, data)
        let self = this;
        switch( evt.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
                var fragCurrent = this.fragCurrent;
                debugger;
                const fragNew = data.frag;
                if ( true ) {
                    let tracks = data.tracks, trackName, track;
                    // if audio track is expected to come from audio stream controller, discard any coming from main
                    if (tracks.audio && this.altAudio) {
                        delete tracks.audio;
                    }
                    
                    this.trigger( HLSEvent.BUFFER_CODECS, tracks )
                    // loop through tracks that are going to be provided to bufferController
                    for (trackName in tracks) {
                        track = tracks[trackName];
                        window.debug && console.log(`main track:${trackName},container:${track.container},codecs[level/parsed]=[${track.levelCodec}/${track.codec}]`);
                        let initSegment = track.initSegment;
                        if (initSegment) {
                            if( trackName == 'video'){
                                this.appended = true;
                            // arm pending Buffering flag before appending a segment
                            this.pendingBuffering = true;
                            this.pushTrack( { type: trackName, data: initSegment, parent: 'main', content: 'initSegment' } )
                            }
                            
                        }
                    }
                    // trigger handler right now
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSING:
                //由Demuxer主动触发
                this._state =  STATE.PARSING;
                break;
            case HLSEvent.FRAG_PARSING_DATA:
                var fragCurrent = this.fragCurrent;
                var fragNew = data.frag;

                data.id = 'main';
                if ( data.id === 'main'  && // filter out main audio if audio track is loaded through audio stream controller
                this._state === STATE.PARSING) {                   
                    if (isNaN(data.endPTS)) {
                        data.endPTS = data.startPTS + fragCurrent.duration;
                        data.endDTS = data.startDTS + fragCurrent.duration;
                    }

                    if (data.hasAudio === true) {
                        //TODO
                        //frag.addElementaryStream(loader_fragment.ElementaryStreamTypes.AUDIO);
                    }

                    if (data.hasVideo === true) {
                        //TODO
                        //frag.addElementaryStream(loader_fragment.ElementaryStreamTypes.VIDEO);
                    }

                    window.debug && console.log('Parsed ' + data.type + ',PTS:[' + data.startPTS.toFixed(3) + ',' + data.endPTS.toFixed(3) + '],DTS:[' + data.startDTS.toFixed(3) + '/' + data.endDTS.toFixed(3) + '],nb:' + data.nb + ',dropped:' + (data.dropped || 0));

                    

                    if( data ){
                        console.log("Parsed:", data.data1.byteLength, data.data2.byteLength)
                    }
                    /** TODO 
                    var drift = updateFragPTSDTS(level.details, frag, data.startPTS, data.endPTS, data.startDTS, data.endDTS),
                    hls = this.hls;
                    hls.trigger(events[].LEVEL_PTS_UPDATED, { details: level.details, level: this.level, drift: drift, type: data.type, start: data.startPTS, end: data.endPTS });
                    // has remuxer dropped video frames located before first keyframe ?
                    */
                    [data.data1, data.data2].forEach(function (buffer) {
                        // only append in PARSING state (rationale is that an appending error could happen synchronously on first segment appending)
                        // in that case it is useless to append following segments
                        if ( buffer && buffer.length && self.state === STATE.PARSING) {
                            self.appended = true;
                            // arm pending Buffering flag before appending a segment
                            self.pendingBuffering = true;
                            self.pushTrack( { type: data.type, data: buffer, parent: 'main', content: 'data' } )
                        }
                    });
                    this.tick();
                }
                break;
            case HLSEvent.FRAG_PARSED:
                var fragCurrent = this.fragCurrent;
                var fragNew = data.frag;
                data.id = 'main'
                if (fragCurrent &&
                    data.id === 'main' &&
                    fragNew.sn === fragCurrent.sn &&
                    fragNew.level === fragCurrent.level &&
                    this._state === STATE.PARSING) {
                  
                    this._state = STATE.PARSED;
                    this._checkAppendedParsed();
                    this.tick();
                }
                break;
        }
    }

    checkPendingTracks(){
        //pendingTracks只有在mediaSource未打开时才会创建
        // try to create sourcebuffers if mediasource opened
        // if any buffer codecs pending, check if we have enough to create sourceBuffers

        var pendingTracks = this.pendingTracks || {},
            pendingTracksNb = Object.keys(pendingTracks).length;
        // if any pending tracks and (if nb of pending tracks gt or equal than expected nb or if unknown expected nb)
        if (pendingTracksNb && (this.sourceBufferNb <= pendingTracksNb || this.sourceBufferNb === 0)) {
          // ok, let's create them now !
          this.createSourceBuffers(pendingTracks);
          this.pendingTracks = {};
          // append any pending segments now !
          this.doAppending();
        }
    }

    onMediaSourceEvent( evt ){
        switch( evt.type ){
            case 'sourceopen':
                this.trigger( MediaEvent.MEDIA_ATTACHED );
                let media = this.media;
                media.addEventListener('seeking', this.evtOnVideoEvent );
                media.addEventListener('seeked', this.evtOnVideoEvent );
                media.addEventListener('loadedmetadata', this.evtOnVideoEvent);
                media.addEventListener('ended', this.evtOnVideoEvent );
                

                this.startLoad();
                //debug
                console.log("#########source open");
                //this.play();
                // once received, don't listen anymore to sourceopen event
                this.mediaSource.removeEventListener('sourceopen', this.evtOnMediaSourceEvent );
                
                break;
            case 'sourceended':
                break;
            case 'sourceclose':
                break;
        }
    }

    onSourceBufferEvent( evt ){
        console.log("event:sourceBuffer", evt)
        switch(evt.type){
            case "updateend":
                //流更新后，发现无可用字节 
                this.appending = false;
                this.doAppending();
                this.onSBUpdateEnd();

                this.mediaSource.endOfStream();
                break;
            case "error":
                debugger;
                console.log("buffer error");
                break;
        }
    }
    onSBUpdateEnd(){
        let pending = this.segments.reduce((counter, segment) => (segment.parent === parent) ? counter + 1 : counter, 0);
        this.pendingBuffering = pending > 0;
        this._checkAppendedParsed();
        this.doAppending();
    }

    /** 检测append的数据是否解析完 */
    _checkAppendedParsed(){
        // trigger handler right now
        
    }


    doAppending(){
        let hls = this.hls, sourceBuffer = this.sourceBuffer, segments = this.segments;
        if (Object.keys(sourceBuffer).length) {
            if (this.media.error) {
                console.log("error", this.media.error)
                this.segments = [];
                window.debug && console.error('trying to append although a media error occured, flush segment and abort');
                return;
            }
            if (this.appending) {
                // window.debug && console.log(`sb appending in progress`);
                return;
            }
            if (segments && segments.length) {
                let segment = segments.shift();
                try {
                    let type = segment.type, sb = sourceBuffer[type];
                    if (sb) {
                        if (!sb.updating) {
                            // reset sourceBuffer ended flag before appending segment
                            sb.ended = false;
                            // window.debug && console.log(`appending ${segment.content} ${type} SB, size:${segment.data.length}, ${segment.parent}`);
                            this.parent = segment.parent;
                            
                            if( type == 'video'){
                                console.log("appendBuffer:", segment)
                                var testBuffer = '{"0":0,"1":0,"2":0,"3":24,"4":102,"5":116,"6":121,"7":112,"8":105,"9":115,"10":111,"11":109,"12":0,"13":0,"14":0,"15":1,"16":105,"17":115,"18":111,"19":109,"20":97,"21":118,"22":99,"23":49,"24":0,"25":0,"26":2,"27":124,"28":109,"29":111,"30":111,"31":118,"32":0,"33":0,"34":0,"35":108,"36":109,"37":118,"38":104,"39":100,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":0,"52":0,"53":0,"54":3,"55":232,"56":0,"57":1,"58":151,"59":75,"60":0,"61":1,"62":0,"63":0,"64":1,"65":0,"66":0,"67":0,"68":0,"69":0,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":1,"78":0,"79":0,"80":0,"81":0,"82":0,"83":0,"84":0,"85":0,"86":0,"87":0,"88":0,"89":0,"90":0,"91":0,"92":0,"93":1,"94":0,"95":0,"96":0,"97":0,"98":0,"99":0,"100":0,"101":0,"102":0,"103":0,"104":0,"105":0,"106":0,"107":0,"108":64,"109":0,"110":0,"111":0,"112":0,"113":0,"114":0,"115":0,"116":0,"117":0,"118":0,"119":0,"120":0,"121":0,"122":0,"123":0,"124":0,"125":0,"126":0,"127":0,"128":0,"129":0,"130":0,"131":0,"132":0,"133":0,"134":0,"135":0,"136":255,"137":255,"138":255,"139":255,"140":0,"141":0,"142":1,"143":224,"144":116,"145":114,"146":97,"147":107,"148":0,"149":0,"150":0,"151":92,"152":116,"153":107,"154":104,"155":100,"156":0,"157":0,"158":0,"159":7,"160":0,"161":0,"162":0,"163":0,"164":0,"165":0,"166":0,"167":0,"168":0,"169":0,"170":0,"171":1,"172":0,"173":0,"174":0,"175":0,"176":0,"177":1,"178":151,"179":75,"180":0,"181":0,"182":0,"183":0,"184":0,"185":0,"186":0,"187":0,"188":0,"189":0,"190":0,"191":0,"192":0,"193":0,"194":0,"195":0,"196":0,"197":1,"198":0,"199":0,"200":0,"201":0,"202":0,"203":0,"204":0,"205":0,"206":0,"207":0,"208":0,"209":0,"210":0,"211":0,"212":0,"213":1,"214":0,"215":0,"216":0,"217":0,"218":0,"219":0,"220":0,"221":0,"222":0,"223":0,"224":0,"225":0,"226":0,"227":0,"228":64,"229":0,"230":0,"231":0,"232":1,"233":67,"234":0,"235":0,"236":1,"237":8,"238":0,"239":0,"240":0,"241":0,"242":1,"243":124,"244":109,"245":100,"246":105,"247":97,"248":0,"249":0,"250":0,"251":32,"252":109,"253":100,"254":104,"255":100,"256":0,"257":0,"258":0,"259":0,"260":0,"261":0,"262":0,"263":0,"264":0,"265":0,"266":0,"267":0,"268":0,"269":0,"270":3,"271":232,"272":0,"273":1,"274":151,"275":75,"276":85,"277":196,"278":0,"279":0,"280":0,"281":0,"282":0,"283":45,"284":104,"285":100,"286":108,"287":114,"288":0,"289":0,"290":0,"291":0,"292":0,"293":0,"294":0,"295":0,"296":118,"297":105,"298":100,"299":101,"300":0,"301":0,"302":0,"303":0,"304":0,"305":0,"306":0,"307":0,"308":0,"309":0,"310":0,"311":0,"312":86,"313":105,"314":100,"315":101,"316":111,"317":72,"318":97,"319":110,"320":100,"321":108,"322":101,"323":114,"324":0,"325":0,"326":0,"327":1,"328":39,"329":109,"330":105,"331":110,"332":102,"333":0,"334":0,"335":0,"336":20,"337":118,"338":109,"339":104,"340":100,"341":0,"342":0,"343":0,"344":1,"345":0,"346":0,"347":0,"348":0,"349":0,"350":0,"351":0,"352":0,"353":0,"354":0,"355":0,"356":36,"357":100,"358":105,"359":110,"360":102,"361":0,"362":0,"363":0,"364":28,"365":100,"366":114,"367":101,"368":102,"369":0,"370":0,"371":0,"372":0,"373":0,"374":0,"375":0,"376":1,"377":0,"378":0,"379":0,"380":12,"381":117,"382":114,"383":108,"384":32,"385":0,"386":0,"387":0,"388":1,"389":0,"390":0,"391":0,"392":231,"393":115,"394":116,"395":98,"396":108,"397":0,"398":0,"399":0,"400":155,"401":115,"402":116,"403":115,"404":100,"405":0,"406":0,"407":0,"408":0,"409":0,"410":0,"411":0,"412":1,"413":0,"414":0,"415":0,"416":139,"417":97,"418":118,"419":99,"420":49,"421":0,"422":0,"423":0,"424":0,"425":0,"426":0,"427":0,"428":1,"429":0,"430":0,"431":0,"432":0,"433":0,"434":0,"435":0,"436":0,"437":0,"438":0,"439":0,"440":0,"441":0,"442":0,"443":0,"444":0,"445":1,"446":96,"447":1,"448":8,"449":0,"450":72,"451":0,"452":0,"453":0,"454":72,"455":0,"456":0,"457":0,"458":0,"459":0,"460":0,"461":0,"462":1,"463":10,"464":120,"465":113,"466":113,"467":47,"468":102,"469":108,"470":118,"471":46,"472":106,"473":115,"474":0,"475":0,"476":0,"477":0,"478":0,"479":0,"480":0,"481":0,"482":0,"483":0,"484":0,"485":0,"486":0,"487":0,"488":0,"489":0,"490":0,"491":0,"492":0,"493":0,"494":0,"495":0,"496":24,"497":255,"498":255,"499":0,"500":0,"501":0,"502":53,"503":97,"504":118,"505":99,"506":67,"507":1,"508":77,"509":64,"510":31,"511":255,"512":225,"513":0,"514":30,"515":103,"516":77,"517":64,"518":31,"519":150,"520":98,"521":2,"522":193,"523":31,"524":203,"525":255,"526":128,"527":5,"528":128,"529":6,"530":8,"531":0,"532":0,"533":3,"534":0,"535":8,"536":0,"537":0,"538":3,"539":0,"540":244,"541":120,"542":193,"543":136,"544":144,"545":1,"546":0,"547":4,"548":104,"549":238,"550":188,"551":128,"552":0,"553":0,"554":0,"555":16,"556":115,"557":116,"558":116,"559":115,"560":0,"561":0,"562":0,"563":0,"564":0,"565":0,"566":0,"567":0,"568":0,"569":0,"570":0,"571":16,"572":115,"573":116,"574":115,"575":99,"576":0,"577":0,"578":0,"579":0,"580":0,"581":0,"582":0,"583":0,"584":0,"585":0,"586":0,"587":20,"588":115,"589":116,"590":115,"591":122,"592":0,"593":0,"594":0,"595":0,"596":0,"597":0,"598":0,"599":0,"600":0,"601":0,"602":0,"603":0,"604":0,"605":0,"606":0,"607":16,"608":115,"609":116,"610":99,"611":111,"612":0,"613":0,"614":0,"615":0,"616":0,"617":0,"618":0,"619":0,"620":0,"621":0,"622":0,"623":40,"624":109,"625":118,"626":101,"627":120,"628":0,"629":0,"630":0,"631":32,"632":116,"633":114,"634":101,"635":120,"636":0,"637":0,"638":0,"639":0,"640":0,"641":0,"642":0,"643":1,"644":0,"645":0,"646":0,"647":1,"648":0,"649":0,"650":0,"651":0,"652":0,"653":0,"654":0,"655":0,"656":0,"657":1,"658":0,"659":1}';
                                testBuffer = JSON.parse( testBuffer );
                                var arr = []
                                for(var i in testBuffer){
                                    arr.push(testBuffer[i])
                                }
                                var uint8 = new Uint8Array( arr );
                                var b = uint8.buffer;
                                debugger;
                                sb.appendBuffer(b); 
                            }
                            
                            this.appendError = 0;
                            this.appended++;
                            this.appending = true;
                        } else {
                            segments.unshift(segment);
                        }
                    } else {
                        // in case we don't have any source buffer matching with this segment type,
                        // it means that Mediasource fails to create sourcebuffer
                        // discard this segment, and trigger update end
                        this.onSBUpdateEnd();
                    }
                } catch (err) {
                    console.error("appendBuffer error:", err)
                }
            }else{
                
                
            }
        }
    }

    createSourceBuffers( tracks ){
        let sourceBuffer = this.sourceBuffer, 
            mediaSource = this.mediaSource;
        for (let trackName in tracks) {
          if (!sourceBuffer[trackName]) {
            let track = tracks[trackName];
            // use levelCodec as first priority
            let codec = track.levelCodec || track.codec;
            let mimeType = `${track.container};codecs=${codec}`;
            window.debug && console.log(`creating sourceBuffer(${mimeType})`);
            try {
                console.log("bind event....................")
              let sb = sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
              sb.addEventListener('updateend', this.evtOnSourceBufferEvent);
              //sb.addEventListener('error', this.evtOnSourceBufferEvent);
              sb.addEventListener('error',function(codec,trackName,tracks){
                return function(){
                    console.log('error')
                    debugger;
                    console.log(codec, trackName, tracks)
                }
              }(codec,trackName,tracks))
              //this.tracks[trackName] = { codec: codec, container: track.container };
              track.buffer = sb;
            } catch (err) {
                console.error('sb error', err)
              window.debug && console.error(`error while trying to add sourceBuffer:${err.message}`);
              //this.hls.trigger(Event.ERROR, { type: ErrorTypes.MEDIA_ERROR, details: ErrorDetails.BUFFER_ADD_CODEC_ERROR, fatal: false, err: err, mimeType: mimeType });
            }
          }
        }
        //this.hls.trigger(Event.BUFFER_CREATED, { tracks: tracks });
    }


    /**
     * @param {Object} track
     * { type: trackName, data: initSegment, parent: 'main', content: 'initSegment/data' }
     */
    pushTrack( track ){
        if (!this._needsFlush) {
            if (!this.segments) {
                this.segments = [ track ];
            } else {
                this.segments.push( track );
            }
            this.doAppending();
        }
    }

    tick(){
        console.log("state...", this._state)
        switch( this._state ){
            case STATE.IDLE:
                if( !this.media ) return;
                // determine next candidate fragment to be loaded, based on current position and
                //  end of buffer position
                //  ensure 60s of buffer upfront
                // if we have not yet loaded any fragment, start loading from start position
                let pos = 0;
                if (this.loadedmetadata) {
                    pos = this.media.currentTime;
                } else {
                    pos = this.nextLoadPosition || 0;
                }
                /*
                // determine next load level
                if (this.startFragmentRequested === false) {
                    level = this.startLevel;
                } else {
                    // we are not at playback start, get next load level from level Controller
                    level = hls.nextLoadLevel;
                }
                */


                if( !this.startPosition ) this.startPosition = 0;
                var bufferInfo = this.bufferInfo(pos, 0.3),
                    bufferLen = bufferInfo.len,
                    bufferEnd = bufferInfo.end,
                    fragPrevious = this.fragPrevious,
                    maxBufLen;
                var level = this._level;//暂只处理单码率
                
                // compute max Buffer Length that we could get from this load level, based on level bitrate. don't buffer more than 60 MB and more than 30s
                if (this._levels[level].hasOwnProperty('bitrate')) {
                    maxBufLen = Math.max(8 * this.option.maxBufferSize / this._levels[level].bitrate, this.option.maxBufferLength);
                    maxBufLen = Math.min(maxBufLen, this.option.maxMaxBufferLength);
                } else {
                    maxBufLen = this.option.maxBufferLength;
                }
                let levelDetails = this._levels[level].details;
                console.log("level", level, "bufferLen", bufferLen, "maxBufLen", maxBufLen)
                if( !levelDetails ){
                    this._state = STATE.WAITING_LEVEL;
                    this.load(this._levels[level].url, level );
                    return;
                }
                if (bufferLen < maxBufLen ) {
                    
                    if( typeof levelDetails == 'undefined'){
                        //等待码率切换
                        return;
                    }
                    var fragments = levelDetails.fragments,
                    fragLen = fragments.length,
                    start = fragments[0].start,
                    end = fragments[fragLen - 1].start + fragments[fragLen - 1].duration;
                    console.log("fragLen", fragLen, start, end)
                    var _frag = undefined;

                    if (!_frag) {
                        var foundFrag;
                        if (bufferEnd < end) {
                            foundFrag = BinarySearch.search(fragments,
                            function(candidate) {
                                //window.debug && console.log(`level/sn/start/end/bufEnd:${level}/${candidate.sn}/${candidate.start}/${(candidate.start+candidate.duration)}/${bufferEnd}`);
                                // offset should be within fragment boundary
                                if (candidate.start + candidate.duration <= bufferEnd) {
                                    return 1;
                                } else if (candidate.start > bufferEnd) {
                                    return - 1;
                                }
                                return 0;
                            });
                        }else{
                            foundFrag = fragments[fragLen - 1];// reach end of playlist
                        }
                        if( levelDetails.initSegment && !levelDetails.initSegment.data ){
                            //mp4初始frag
                            foundFrag = levelDetails.initSegment;
                        }
                        if( foundFrag ){
                            _frag = foundFrag;
                            start = foundFrag.start;
                            //window.debug && console.log('find SN matching with pos:' +  bufferEnd + ':' + frag.sn);
                            if (fragPrevious && _frag.level === fragPrevious.level && _frag.sn === fragPrevious.sn) {
                                if (_frag.sn < levelDetails.endSN) {
                                    _frag = fragments[_frag.sn + 1 - levelDetails.startSN];
                                    //拖到上一段未，prev和cur的idx一致
                                    window.debug && console.log('SN just loaded, load next one: ' + _frag.sn);
                                }else{
                                    if (!levelDetails.live) {
                                        var mediaSource = this.mediaSource;
                                        var state = mediaSource.readyState;
                                        console.log("----------source state", state);
                                        if (mediaSource && mediaSource.readyState === 'open') {
                                            // ensure sourceBuffer are not in updating states
                                            var sb = this.sourceBuffer;
                                            if (! (sb.audio && sb.audio.updating || sb.video && sb.video.updating)) {
                                                console.log('all media data available, signal endOfStream() to MediaSource');
                                                //Notify the media element that it now has all of the media data
                                                mediaSource.endOfStream();
                                            }
                                        }
                                    }
                                    _frag = null; //?看不懂
                                }
                            }
                        }

                        if( _frag ){
                            if ( _frag.decryptdata && _frag.decryptdata.uri != null && _frag.decryptdata.key == null) {
                                //TODO,有加密段
                            }else{
                                this.fragCurrent = _frag;
                                this.startFragmentRequested = true;
                                this.loadFrag( _frag );
                            }
                        }
                    }
                }
                break;
            case STATE.PARSING:
                //等待状态变为parsed
                break;
            case STATE.PARSED:
                console.log("appendBuffer....", this.segments)
                if( this.sourceBuffer ){
                    if (this.media.error) {
                        console.error('trying to append although a media error occured, switch to ERROR state');
                        //this.state = STATE.ERROR;
                        return;
                    }
                    // if MP4 segment appending in progress nothing to do
                    if (this.sourceBuffer.audio && this.sourceBuffer.audio.updating || this.sourceBuffer.video && this.sourceBuffer.video.updating) {
                        console.log("updating....")
                    }else if( this.mp4segments.length ){
                        var segment = this.mp4segments.shift();
                        try {
                            //window.debug && console.log(`appending ${segment.type} SB, size:${segment.data.length});
                            console.time("TIME[sourcebuffer]");
                            console.log("segment:", segment);
                            console.log("segment", segment.data, "length=", segment.data.length);
                            this.sourceBuffer[segment.type].appendBuffer(segment.data);
                            this.appendError = 0;
                        } catch(err) {
                            console.error("appendBuffer error:", err)
                            // in case any error occured while appending, put back segment in mp4segments table
                            window.debug && console.error(`error while trying to append buffer:${err.message},try appending later`);
                            this.mp4segments.unshift(segment);
                            if (this.appendError) {
                                this.appendError++;
                            } else {
                                this.appendError = 1;
                            }
                            /*
                            var event = {
                                type: _errors.ErrorTypes.MEDIA_ERROR,
                                details: _errors.ErrorDetails.BUFFER_APPEND_ERROR,
                                frag: this.fragCurrent
                            };
                            /* with UHD content, we could get loop of quota exceeded error until
                            browser is able to evict some data from sourcebuffer. retrying help recovering this
                            */
                            /*
                            if (this.appendError > this.config.appendErrorMaxRetry) {
                                console.log('fail ' + this.config.appendErrorMaxRetry + ' times to append segment in sourceBuffer');
                                event.fatal = true;
                                hls.trigger(_events2['default'].ERROR, event);
                                this.state = STATE.ERROR;
                                return;
                            } else {
                                event.fatal = false;
                                hls.trigger(_events2['default'].ERROR, event);
                            }
                            */
                        }
                    }else{
                        this._state = STATE.IDLE;
                        this.tick();
                    }
                    
                }
                break;

        }
    }

    get state(){
        return this._state;
    }
    
    startLoad(){
        this.loader.open( this.option.url );
        //this.loader.open( this.)
    }
    play(){}
}

export default BufferStream;
export { BufferStream };