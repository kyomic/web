let EventEmitter = require('event-emitter')

require('./langFix');

console.log("EventEmitter",EventEmitter)

let idPrefix = '__FILE_',
	rExt = /\.([^.]+)$/;

class KAbstractFile{
	constructor( source = null ){
		this.blob = null;
		this.source = source || {};	
		this.id = idPrefix + KAbstractFile.index ++;
        EventEmitter( this );
	}

	update(){
		/**
         * 文件名，包括扩展名（后缀）
         * @property name
         * @type {string}
         */
        this.name = this.name || this._source.name || 'Untitled';

        /**
         * 文件体积（字节）
         * @property size
         * @type {uint}
         * @default 0
         */
        this.size = this.size || this._source.size || (this.blob?this.blob.size:0) || 0;

        /**
         * 文件MIMETYPE类型，与文件类型的对应关系请参考[http://t.cn/z8ZnFny](http://t.cn/z8ZnFny)
         * @property type
         * @type {string}
         * @default 'application'
         */
        this.type = this.type || this._source.type || (this.blob?this.blob.type:'') || 'application';

        /**
         * 文件最后修改日期
         * @property lastModifiedDate
         * @type {int}
         * @default 当前时间戳
         */
        this.lastModifiedDate = this._source.lastModifiedDate || (new Date() * 1);

        /**
         * 文件扩展名，通过文件名获取，例如test.png的扩展名为png
         * @property ext
         * @type {string}
         */
        this.ext = this.ext || (rExt.exec( this._source.name ) ? RegExp.$1 : '');
	}
	set source( s ){
		this._source = s;
		this.update();
	}

	get source(){
		return this._source;
	}
}
KAbstractFile.index = 0;
export default KAbstractFile;