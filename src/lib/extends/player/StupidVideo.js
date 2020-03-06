import EventEmitter from 'event-emitter'
import { Loader } from '@/lib/loader'
import { Demuxer } from './core/stream/demux';
import { HLSEvent, MediaEvent } from './event/HLSEvent';

class StupidVideo{
	constructor( option ){
		EventEmitter(this);

		let root = option.target || document.body;
		this.video = document.createElement("video");
		this.video.setAttribute("controls",true)
		this.video.setAttribute("autoplay",true)
		root.appendChild( this.video )

		this.demuxer = new Demuxer( this );

		let media = this.video;
        media.addEventListener('seeking', this.onVideoEvent.bind(this) );
        media.addEventListener('seeked', this.onVideoEvent.bind(this) );
        media.addEventListener('loadedmetadata', this.onVideoEvent.bind(this) );
        media.addEventListener('ended', this.onVideoEvent.bind(this) );
        media.addEventListener('error', this.onVideoEvent.bind(this) );
        
        var ms = this.mediaSource = new MediaSource();
        ms.addEventListener('sourceopen', this.onMediaSourceEvent.bind(this));
        ms.addEventListener('sourceended', this.onMediaSourceEvent.bind(this));
        ms.addEventListener('sourceclose', this.onMediaSourceEvent.bind(this));

        media.src = URL.createObjectURL(ms);

        this.sourceBuffer = null;
        this.mp4segments = null;

        this.on( HLSEvent.FRAG_PARSED, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING_DATA, this.onDemuxEvent.bind(this) );
        this.on( HLSEvent.FRAG_PARSING_INIT_SEGMENT, this.onDemuxEvent.bind(this) );
	}

	trigger( type, data ){
		let evt = { type:type }
		this.emit( type, evt, data )
	}

	get option(){
		return {

		}
	}
	onVideoEvent(e){
		console.log("on videoevent:", e );
		if( e.type == 'loadedmetadata'){
			console.log("视频时长：", media.duration)
		}
	}

	onMediaSourceEvent(e){
		switch(e.type){
			case 'sourceopen':
				this.load();
				break;
		}
	}

	onDemuxEvent( e , data){
		console.log("on demux event", e, data)
		let self = this;
		let mediaSource = this.mediaSource;
        switch( e.type ){            
            case HLSEvent.FRAG_PARSING_INIT_SEGMENT:
            	let track = null;
            	let tracks = data.tracks;
            	if( !this.sourceBuffer || Object.keys(this.sourceBuffer).length === 0){
            		this.sourceBuffer = {};
            		for (let trackName in tracks){
            			track = tracks[ trackName ];
            			let codec = track.levelCodec || track.codec;
            			let mimeType = `${track.container};codecs=${codec}`;
            			console.log( trackName, codec, mimeType );
            			try {
				            let sb = this.sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
				            sb.addEventListener('updateend', this.onSourceBufferEvent.bind(this, track));
				            sb.addEventListener('error', this.onSourceBufferEvent.bind(this, track));
			              	track.buffer = sb;
			            } catch (err) {
			            }
            		}
            				                
            	}

            	if( !this.mp4segments ){
            		this.mp4segments = [];
            	}
            	for (let trackName in tracks){
            		track = tracks[trackName];
            		this.mp4segments.push({
            			type:trackName,
            			data:track.initSegment
            		})
            	}
                this.checkPedding();
                break;
            case HLSEvent.FRAG_PARSING:
                //由Demuxer主动触发
                this._state =  STATE.PARSING;
                break;
            case HLSEvent.FRAG_PARSING_DATA:
                
                break;
            case HLSEvent.FRAG_PARSED:
                
                break;
        }
	}

	onSourceBufferEvent(data,e){
		console.log("on sourcebuffer event:",e,data)
		switch(e.type){
			case 'updateend':
				this.checkPedding();
				break;
		}
	}


	load(){
		this.loader = new Loader();
        this.loader.on('data', res=>{
            this.demuxer.push( res.data.chunk, [], '','', {
                cc:0,
            } )
        })
		this.loader.open( "http://test.fun.tv/test.flv" );
	}

	checkPedding(){
		if( !this.sourceBuffer ){
			return;
		}
		if( this.sourceBuffer.audio && this.sourceBuffer.audio.updating ){
			return;
		}
		if( this.sourceBuffer.video && this.sourceBuffer.video.updating ){
			return;
		}
		if( this.mp4segments.length){
			let segment = this.mp4segments.shift();
			if( segment.type =='audio'){
				segment = this.mp4segments.shift();
			}
			try{
				var testBuffer = '{"0":0,"1":0,"2":0,"3":24,"4":102,"5":116,"6":121,"7":112,"8":105,"9":115,"10":111,"11":109,"12":0,"13":0,"14":0,"15":1,"16":105,"17":115,"18":111,"19":109,"20":97,"21":118,"22":99,"23":49,"24":0,"25":0,"26":2,"27":124,"28":109,"29":111,"30":111,"31":118,"32":0,"33":0,"34":0,"35":108,"36":109,"37":118,"38":104,"39":100,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,"51":0,"52":0,"53":0,"54":3,"55":232,"56":0,"57":1,"58":151,"59":75,"60":0,"61":1,"62":0,"63":0,"64":1,"65":0,"66":0,"67":0,"68":0,"69":0,"70":0,"71":0,"72":0,"73":0,"74":0,"75":0,"76":0,"77":1,"78":0,"79":0,"80":0,"81":0,"82":0,"83":0,"84":0,"85":0,"86":0,"87":0,"88":0,"89":0,"90":0,"91":0,"92":0,"93":1,"94":0,"95":0,"96":0,"97":0,"98":0,"99":0,"100":0,"101":0,"102":0,"103":0,"104":0,"105":0,"106":0,"107":0,"108":64,"109":0,"110":0,"111":0,"112":0,"113":0,"114":0,"115":0,"116":0,"117":0,"118":0,"119":0,"120":0,"121":0,"122":0,"123":0,"124":0,"125":0,"126":0,"127":0,"128":0,"129":0,"130":0,"131":0,"132":0,"133":0,"134":0,"135":0,"136":255,"137":255,"138":255,"139":255,"140":0,"141":0,"142":1,"143":224,"144":116,"145":114,"146":97,"147":107,"148":0,"149":0,"150":0,"151":92,"152":116,"153":107,"154":104,"155":100,"156":0,"157":0,"158":0,"159":7,"160":0,"161":0,"162":0,"163":0,"164":0,"165":0,"166":0,"167":0,"168":0,"169":0,"170":0,"171":1,"172":0,"173":0,"174":0,"175":0,"176":0,"177":1,"178":151,"179":75,"180":0,"181":0,"182":0,"183":0,"184":0,"185":0,"186":0,"187":0,"188":0,"189":0,"190":0,"191":0,"192":0,"193":0,"194":0,"195":0,"196":0,"197":1,"198":0,"199":0,"200":0,"201":0,"202":0,"203":0,"204":0,"205":0,"206":0,"207":0,"208":0,"209":0,"210":0,"211":0,"212":0,"213":1,"214":0,"215":0,"216":0,"217":0,"218":0,"219":0,"220":0,"221":0,"222":0,"223":0,"224":0,"225":0,"226":0,"227":0,"228":64,"229":0,"230":0,"231":0,"232":1,"233":67,"234":0,"235":0,"236":1,"237":8,"238":0,"239":0,"240":0,"241":0,"242":1,"243":124,"244":109,"245":100,"246":105,"247":97,"248":0,"249":0,"250":0,"251":32,"252":109,"253":100,"254":104,"255":100,"256":0,"257":0,"258":0,"259":0,"260":0,"261":0,"262":0,"263":0,"264":0,"265":0,"266":0,"267":0,"268":0,"269":0,"270":3,"271":232,"272":0,"273":1,"274":151,"275":75,"276":85,"277":196,"278":0,"279":0,"280":0,"281":0,"282":0,"283":45,"284":104,"285":100,"286":108,"287":114,"288":0,"289":0,"290":0,"291":0,"292":0,"293":0,"294":0,"295":0,"296":118,"297":105,"298":100,"299":101,"300":0,"301":0,"302":0,"303":0,"304":0,"305":0,"306":0,"307":0,"308":0,"309":0,"310":0,"311":0,"312":86,"313":105,"314":100,"315":101,"316":111,"317":72,"318":97,"319":110,"320":100,"321":108,"322":101,"323":114,"324":0,"325":0,"326":0,"327":1,"328":39,"329":109,"330":105,"331":110,"332":102,"333":0,"334":0,"335":0,"336":20,"337":118,"338":109,"339":104,"340":100,"341":0,"342":0,"343":0,"344":1,"345":0,"346":0,"347":0,"348":0,"349":0,"350":0,"351":0,"352":0,"353":0,"354":0,"355":0,"356":36,"357":100,"358":105,"359":110,"360":102,"361":0,"362":0,"363":0,"364":28,"365":100,"366":114,"367":101,"368":102,"369":0,"370":0,"371":0,"372":0,"373":0,"374":0,"375":0,"376":1,"377":0,"378":0,"379":0,"380":12,"381":117,"382":114,"383":108,"384":32,"385":0,"386":0,"387":0,"388":1,"389":0,"390":0,"391":0,"392":231,"393":115,"394":116,"395":98,"396":108,"397":0,"398":0,"399":0,"400":155,"401":115,"402":116,"403":115,"404":100,"405":0,"406":0,"407":0,"408":0,"409":0,"410":0,"411":0,"412":1,"413":0,"414":0,"415":0,"416":139,"417":97,"418":118,"419":99,"420":49,"421":0,"422":0,"423":0,"424":0,"425":0,"426":0,"427":0,"428":1,"429":0,"430":0,"431":0,"432":0,"433":0,"434":0,"435":0,"436":0,"437":0,"438":0,"439":0,"440":0,"441":0,"442":0,"443":0,"444":0,"445":1,"446":96,"447":1,"448":8,"449":0,"450":72,"451":0,"452":0,"453":0,"454":72,"455":0,"456":0,"457":0,"458":0,"459":0,"460":0,"461":0,"462":1,"463":10,"464":120,"465":113,"466":113,"467":47,"468":102,"469":108,"470":118,"471":46,"472":106,"473":115,"474":0,"475":0,"476":0,"477":0,"478":0,"479":0,"480":0,"481":0,"482":0,"483":0,"484":0,"485":0,"486":0,"487":0,"488":0,"489":0,"490":0,"491":0,"492":0,"493":0,"494":0,"495":0,"496":24,"497":255,"498":255,"499":0,"500":0,"501":0,"502":53,"503":97,"504":118,"505":99,"506":67,"507":1,"508":77,"509":64,"510":31,"511":255,"512":225,"513":0,"514":30,"515":103,"516":77,"517":64,"518":31,"519":150,"520":98,"521":2,"522":193,"523":31,"524":203,"525":255,"526":128,"527":5,"528":128,"529":6,"530":8,"531":0,"532":0,"533":3,"534":0,"535":8,"536":0,"537":0,"538":3,"539":0,"540":244,"541":120,"542":193,"543":136,"544":144,"545":1,"546":0,"547":4,"548":104,"549":238,"550":188,"551":128,"552":0,"553":0,"554":0,"555":16,"556":115,"557":116,"558":116,"559":115,"560":0,"561":0,"562":0,"563":0,"564":0,"565":0,"566":0,"567":0,"568":0,"569":0,"570":0,"571":16,"572":115,"573":116,"574":115,"575":99,"576":0,"577":0,"578":0,"579":0,"580":0,"581":0,"582":0,"583":0,"584":0,"585":0,"586":0,"587":20,"588":115,"589":116,"590":115,"591":122,"592":0,"593":0,"594":0,"595":0,"596":0,"597":0,"598":0,"599":0,"600":0,"601":0,"602":0,"603":0,"604":0,"605":0,"606":0,"607":16,"608":115,"609":116,"610":99,"611":111,"612":0,"613":0,"614":0,"615":0,"616":0,"617":0,"618":0,"619":0,"620":0,"621":0,"622":0,"623":40,"624":109,"625":118,"626":101,"627":120,"628":0,"629":0,"630":0,"631":32,"632":116,"633":114,"634":101,"635":120,"636":0,"637":0,"638":0,"639":0,"640":0,"641":0,"642":0,"643":1,"644":0,"645":0,"646":0,"647":1,"648":0,"649":0,"650":0,"651":0,"652":0,"653":0,"654":0,"655":0,"656":0,"657":1,"658":0,"659":1}';
                testBuffer = JSON.parse( testBuffer );
                var arr = []
                for(var i in testBuffer){
                    arr.push(testBuffer[i])
                }
                var uint8 = new Uint8Array( arr );
                var b = uint8.buffer;


				//this.sourceBuffer[segment.type].appendBuffer(segment.data);
				this.sourceBuffer[segment.type].appendBuffer(b);
				console.log('*** appendBuffer ***', segment.data)
			}catch(e){
				console.error('*** appendBuffer ***', e)
				this.mp4segments.unshift(segment);
			}
		}
	}
}
export default StupidVideo;