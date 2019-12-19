import KFile from './KFile';
import {dataURLtoBlob} from './canvas-to-blob';
console.log("KFile",KFile)

class KImage extends KFile{
	constructor( source = null ){
		super( source );
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
		if( this.source && this.source.nodeType ===1 ){
			let cvs = this.canvas;
			let ctx = cvs.getContext('2d');
			console.log("ctx",cvs, this.source)
			let img = this.source;
			cvs.width = img.width;
			cvs.height = img.height;
	        ctx.drawImage(img, 0, 0, img.width, img.height);
	        //console.log("ext",ext)
	        this._dataUrl = cvs.toDataURL();
	        this.blob = dataURLtoBlob( this._dataUrl );
		}
		     
	}
	/** override **/
	update(){
		this.draw();
		if( this._dataUrl ){
			let match = (this._dataUrl).match(/(?<=\:)[^;]+/i);
			this.type = match ? match[0] : 'image/jpg';
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
					reject(e);
				})
				console.log(this.source,"load src", url)
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