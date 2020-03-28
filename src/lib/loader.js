import EventEmitter from 'event-emitter'

export const HTTP_ERROR = {
	OK:'ok',
	HTTP_STATUS_CODE_INVALID:'http_state_code_invalid',
	CONNECTING_TIMEOUT:'connection_timeout',
	EARLY_EOF:'early_eof'  //请求提前中止
}
export const LoaderStatus = {
	IDLE:0,
	CONNECTIONG:1,
	BUFFERING:2,
	ERROR:3,
	COMPLETE:4,
	ABORT:5
};

class AbstractLoader{
	constructor( ){
		EventEmitter( this );
		this._range = { start:0, end:-1};
		//内容长度
		this._contentLength = null;
		//收到的字节数
    	this._receivedLength = 0;
    	this._source = { method:'GET'}
    	this.loader = null; //负责加载数据的实例
	}
	open( source, range = null ){
		range = range || { start:0, end:-1 };
		if (range.start !== 0 || range.end !== -1) {
			this._range = { start: range.start, end: range.end };
		}
		this._status = LoaderStatus.CONNECTIONG;
		this._source = Object.assign( this._source, source || {} );
	}


	get source(){
		return this._source;
	}

	get range(){
		return this._range;
	}
}

class FetchLoader extends AbstractLoader{
	static probe( context ){
		context = context || self;
		if( context && typeof context.fetch =='function'){
			return true;
		}
		return false;
	}

	open( source, range = null){
		super.open(source, range );

		let headers = new self.Headers();
		let params = {
	      method: 'GET',
	      headers: headers,
	      mode: 'cors',//no-cors,cors
	      cache: 'default',
	      // The default policy of Fetch API in the whatwg standard
	      // Safari incorrectly indicates 'no-referrer' as default policy, fuck it
	      referrerPolicy: 'no-referrer-when-downgrade'
	    };
	    console.log("open source", source, headers)

	    self.fetch( this.source.url, params).then((res) => {   
	    	console.log("res=====",res)   
	      if (res.ok && (res.status >= 200 && res.status <= 299)) {          
	          let lengthHeader = res.headers.get('Content-Length');
	          //屎，竟然为null
	          if (lengthHeader != null) {
	            this._contentLength = parseInt(lengthHeader);
	            if (this._contentLength !== 0) {
	              
	            }
	          }
	          console.log("文件大小", this._contentLength)
	          //ReadableStreamDefaultReader
	          
	          this.read( res.body.getReader() )
	          
	      } else {
	      	this.emit('error',{type:'error', code:res.status||400, detail: HTTP_ERROR.HTTP_STATUS_CODE_INVALID })
	      }
	    }).catch((e) => {
	       console.error(e)
	    });
	}

	read( reader ){
		reader.read().then((result) => {
			let data = null;
      if (result.done) {
      	this._status = LoaderStatus.COMPLETE;
      	data = {
      		start:this._range.start, end: this._range.end + this._receivedLength - 1
      	}
      	console.log("读取完毕：", data)
      	this.emit('complete', {type:'complete', data:data})              
      } else {
      	if( this._status == LoaderStatus.ABORT ){
      		return reader.cancel();
      	}
      	this._status = LoaderStatus.BUFFERING;

      	let chunk = result.value.buffer;
      	let byteStart = this._range.start + this._receivedLength;

      	this._receivedLength += chunk.byteLength;
        
        data = {
        	chunk:chunk, 
        	start: byteStart, end: this._receivedLength
        }
        //console.log("###receive data:", data)
        this.emit('data',{type:'data', data: data })
        this.read( reader )
      }
    })/*.catch((e) => {
        if (e.code === 11 && Browser.msedge) {  // InvalidStateError on Microsoft Edge
            // Workaround: Edge may throw InvalidStateError after ReadableStreamReader.cancel() call
            // Ignore the unknown exception.
            // Related issue: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11265202/
            return;
        }

        this._status = LoaderStatus.kError;
        let type = 0;
        let info = null;

        if ((e.code === 19 || e.message === 'network error') && // NETWORK_ERR
            (this._contentLength === null ||
            (this._contentLength !== null && this._receivedLength < this._contentLength))) {
            type = LoaderErrors.EARLY_EOF;
            info = {code: e.code, msg: 'Fetch stream meet Early-EOF'};
        } else {
            
            info = {code: e.code, msg: e.message};
        }

    });
*/
	}
}

class SocketLoader{

}
class XhrLoader extends AbstractLoader{
	static probe( context ){
		context = context || self;
		try {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://example.com', true);
            xhr.responseType = 'arraybuffer';
            return (xhr.responseType === 'arraybuffer');
        } catch (e) {
            Log.w('RangeLoader', e.message);
            return false;
        }
	}
	constructor( ){
		super();
		this.bytesTotal = 0;
		this.bytesLoaded = 0;
		this.data = null;
		this.evtOnXHREvent = this.onXHREvent.bind( this );
	}

	onXHREvent(e){
		console.log("#############", e.type, e)
		let xhr = e.target;
		switch(e.type){
			case 'readystatechange':
				if (xhr.readyState === 2) {  // 收到头信息 
					if ((xhr.status >= 200 && xhr.status <= 299)) {
						let range = '';
						try{
							range = xhr.getResponseHeader('Content-Range');
						}catch(e){}
						let match = /\d+-\d+\/(\d+)/ig.exec( range );
						if( match && match.length ){
							this.bytesTotal = parseInt( match[1] );
						}
					}
				}
				break;
			case 'progress':
				break;
			case 'load':
				this.data = xhr.response;
				this.bytesLoaded = e.loaded;
				this.emit('complete',{type:'complete'})
				break;
		}
	}
	open( source, range = null){
		super.open( source, range );
		this._internalOpen();
	}

	_getRangeHeader(){
		let range = this.range;
		let header = '';
		if (range.start !== 0 || range.end !== -1) {
			if (range.end !== -1) {
                header = `bytes=${range.start.toString()}-${range.end.toString()}`;
            } else {
                header = `bytes=${range.start.toString()}-`;
            }
		}else{
			header = 'bytes=0-';
		}
		return header;
	}

	_internalOpen(){
		let source = this.source;
		let xhr = new XMLHttpRequest();
		this.loader = xhr;

		xhr.open( source.method, source.url, true );
		console.log('range', this.range )
		xhr.responseType = 'arraybuffer';
		if( source.hasOwnProperty('withCredentials') ){
			//xhr.withCredentials = source.withCredentials;
		}
		var header = source.headers || {};
		header['Range'] = this._getRangeHeader();
		for(var i in header ){
			try{
				xhr.setRequestHeader(i, header[i]);
			}catch( e ){}
		}
		xhr.onreadystatechange = this.evtOnXHREvent.bind(this);
        xhr.onprogress = this.evtOnXHREvent.bind(this);
        xhr.onload = this.evtOnXHREvent.bind(this);
        xhr.onerror = this.evtOnXHREvent.bind(this);

		xhr.send()
	}
}

class RangeLoader extends AbstractLoader{
	static probe( context ){
		return XhrLoader.probe( context );
	}
	static BLOCK_SIZE = 1000;
	constructor( ){
		super();
		this.evtOnXHREvent = this.onXHREvent.bind( this );
		this.blockSize = RangeLoader.BLOCK_SIZE;
		this.bytesTotal = -1;
		this.bytesLoaded = 0;
	}

	onXHREvent(e){
		switch( e.type ){
			case 'complete':
				console.log("文件大小:", this.loader.bytesTotal,"当前块大小",this.loader.bytesLoaded)
				if( this.bytesTotal <0 ){
					this.bytesTotal = this.loader.bytesTotal;
				}
				let start = this.bytesLoaded;
				this.bytesLoaded += this.loader.bytesLoaded;
				let data = {
		        	chunk: this.loader.data, 
		        	start: start, end: this.bytesLoaded
		        }
		        //console.log("###receive data:", data)
		        this.emit('data',{type:'data', data: data })
		        if( this.bytesLoaded >= 100 * 1024 * 10 ){
		        //	return;
		        }
				this._next();

		}
	}

	open( source, range = null){
		super.open( source, range );
		let size = this.range.end - this.range.start;
		if( size > 0 ){
			this.blockSize = size;
		}
		this._internalOpen();
	}

	_internalOpen(){
		if( !this.loader ){
			this.loader = new XhrLoader();
		}
		this.loader.on('complete', this.evtOnXHREvent );
		this._next();
	}

	_next(){
		let range = { start: this.bytesLoaded, end: this.bytesLoaded + this.blockSize -1 };
		if( this.bytesLoaded < this.bytesTotal || this.bytesTotal == -1 ){
			this.loader.open( this.source, range )
		}else{
			console.log('all loaded')
		}
	}
}




export class Loader extends AbstractLoader{
	constructor( option ){
		super();
		this.option = option || {
			type:'fetch'
		};

		this._loader = this.createLoader();
		this._evtOnLoadEvent = this.onLoadEvent.bind( this )
		this._loader.on('data', this._evtOnLoadEvent )
		this._loader.on('complete', this._evtOnLoadEvent );
		this._loader.on('error', this._evtOnLoadEvent )
	}

	onLoadEvent( evt ){
		this.emit(evt.type, evt);
	}
	createLoader(){
		let loader = null;
		switch( this.option.type ){
			case 'fetch':
				loader = FetchLoader;
				break;
			case 'xhr':
				loader = XhrLoader;
				break;
			case 'socket':
				loader = SocketLoader;
				break;
			case 'range':
				loader = RangeLoader;
				break;
		}
		if( loader && loader.probe( self )){
			return new loader();
		}else{
			let l = [ FetchLoader, XhrLoader, SocketLoader ];
			for(let i=0;i<l.length;i++){
				if( l[i].probe( self )){
					return new l[i]();
					break;
				}
			}
		}
		return null;
	}
	open( source, range = null ){
		this._loader.open( source, range );
	}
}


