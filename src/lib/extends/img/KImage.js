import KFile from './KFile';
import {dataURLtoBlob} from './canvas-to-blob';

class KImage extends KFile{
	constructor( source = null ){
		super( source );
		this._originBitmap = null; 	//原始的位图
		this._bitmapData = null; 		//显示的位图
		this._bitmap = null;
		this.source = document.createElement("img");
		this.source.setAttribute("crossOrigin",'anonymous')
		this.options = Object.assign( Object.assign( {}, KImage.OPTIONS ) );		
		this.timeoutId = 0;

		this.onEvtLoad = this.onImageEvent.bind( this );
	}

	onImageEvent(){

	}
	/** 重绘**/
	draw(){		
		if( this.source && this.source.nodeType ===1 && this.source.width ){
			let cvs = this.canvas;
			let ctx = cvs.getContext('2d');
			let img = this.source;
			let w = img.width,
				h = img.height;
			cvs.width = w;
			cvs.height = h;
			try{
				//ios 零尺寸图片绘制会失败
				ctx.drawImage(img, 0, 0, w, h);
			}catch(e){
			}
		        //console.log("ext",ext)
	        this._dataUrl = cvs.toDataURL();
	        this._bitmap = ctx.getImageData(0, 0, w, h); 
	        ctx.putImageData( this._bitmap ,0,0);
	        this.blob = dataURLtoBlob( this._dataUrl );	
		}
	}
	/** override **/
	update(){
		this.draw();
		if( this._dataUrl ){
			//ios 不支持(?<=)零宽断言 
			//let reg = new RegExp("(?<=\\:)[^;]+");
			let match = (this._dataUrl).match( new RegExp("\\w+\\:([^;]+)","i") );
			this.type = match ? match[1] : 'image/jpg';
			this.ext = this.type.split("/")[1];
		}
		super.update();
	}
	_timeout( timeout ){
		timeout = timeout || this.options.timeout;
		return new Promise((resolve, reject)=>{
			setTimeout(_=>{
				reject({type:'error',code:503,'message':'timeout'});
			}, timeout );
		});
	}
	/** 返回图片所在的画布 **/
	get canvas(){
		if( !this._canvas ){
			this._canvas = document.createElement("canvas");
		}
		return this._canvas;
	}

	_loadUrl( url, cb ){
		if( /base64/ig.exec( url )){
			this._dataUrl = url;
		}
		return Promise.race([
			new Promise((resolve,reject)=>{
				this.source.onload = (e=>{
					this.update();
					resolve( this );
				});
				this.source.onerror = (e=>{
					alert('source.onerror'+e);
					reject(e);
				})
				this.source.src = url;
			}),
			this._timeout( this.options.urlTimeout )
		]);
	}
	/**
	 * 
	 * 加载资源
	 * @param {String|Blob} source - 内容可为url,base64,blob
	 * @param {Function} [cb=null] - 回调函数
	 * @param {Object} [option=null] - 请求选项
	 * @return {Promise}
	 */
	async load( source, cb = null, options = null  ){
		console.log("加载，", this.source)
		if( typeof source == 'string'){
			return await this._loadUrl( source, cb );
		}else{
			this.blob = source;
			let result = await this.read( source );
			return await this._loadUrl( result, cb );
		}
	}

	get width(){
		return this.source.width;
	}
	get height(){
		return this.source.height;
	}

	get bitmap(){
		if( this._bitmap ){
			return this._bitmap;
		}
		return null
	}

	/** 
	 * 应用滤镜
	 * @param {BitmapFilter} - filter BitmapFilter实例
	 */
	applyFilter( filter ){
		let ctx = this.canvas.getContext('2d');
		if( !this._originBitmap ){
			this._originBitmap = ctx.createImageData( this._bitmap );
	        //复制备份originBitmap
	        this._bitmap.data.map((val,i)=>{
	        	this._originBitmap.data[i] = val;
	        }) 
		}	       
		let bitmap = this.bitmap;
		console.log("applyFilter:", filter, bitmap)
		if( bitmap && bitmap.width ){
			let data = filter.render( bitmap );
			ctx.putImageData(data,0,0);
		}
		return this;
	}


	putImageData( data ){
		let ctx = this.canvas.getContext('2d');	

		if( !this.source.width ){
			this.source.width =data.width;
			this.source.height=data.height;
			this.update();
		};
		
		let bitmap = this.bitmap;
		if( bitmap && bitmap.width ){
			ctx.putImageData(data,0,0);
		}
	}

	clearFilter(){		
		if( this._originBitmap ){
			this.canvas.getContext('2d').putImageData( this._originBitmap ,0,0);
		}
		let ctx = this.canvas.getContext('2d');
		this._bitmap = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);      
	    ctx.putImageData( this._bitmap ,0,0);
		return this;		
	}

	destroy(){
		this.source.src =  KImage.BLACK;
	}
}
KImage.OPTIONS = {
	/* url 请求超时 */
	urlTimeout:10*1000,
	/* 默认的请求超时 */
	timeout:5*1000
}

KImage.BLACK = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';


export default KImage;
export {KImage};