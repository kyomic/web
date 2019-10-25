import EventEmitter from 'event-emitter'

class Devices{
	constructor(){
		this._context = null;
		EventEmitter( this );

		this.evtOnResize = this.onResize.bind( this );
		this.evtOnLoad = this.onLoad.bind( this );
	}

	/**
	 * 可视区域大小
	 * @member
	 * @readonly 
	 */
	get viewSize(){
		if( this.context ){
			let doc = document,
			client = doc.compatMode == 'BackCompat' ? doc.body : doc.documentElement;
			return {
				width:client.clientWidth,height:client.clientHeight
			}
		}
		return {width:0,height:0}
	}

	/**
	 * 页面滚动大小
	 * @member
	 * @readonly 
	 */
	get scrollSize(){
		if( this.context ){
			let doc = document,
	        body = doc.body,
	        html = doc.documentElement,
	        client = doc.compatMode == 'BackCompat' ? body : doc.documentElement;
	        return {
	        	width:Math.max(html.scrollWidth, body.scrollWidth, client.clientWidth),
	        	height:Math.max(html.scrollHeight, body.scrollHeight, client.clientHeight)
	        }
		}
		return {width:0,height:0}
	}

	onResize(){
		this.emit('resize', {type:'resize', data: this.viewSize });
	}
	onLoad(){
		this.emit('load', {type:'load', data: this.viewSize });
	}

	/**
	 * @member {any} obj - 设置上下文，目前仅支持window,后续支持轻应用
	 */
	set context( obj ){
		if( this._context ){
			this._context.removeEventListener("resize", this.evtOnResize );
		}
		if( obj ){
			this._context = obj;
			this._context.addEventListener("resize", this.evtOnResize );
			this._context.addEventListener("DOMContentLoaded", this.evtOnLoad );
		}else{
			throw new Error("*** Devices.context: 空的context ***");
		}
		
	}

	get context(){
		return this._context;
	}
	/**
	 * 返回 24栅格的代码，如：xs(<768)、sm(>=768)、md(>=992)、lg(>=1200) 和 xl(>=1920)
	 * @member
	 */
	get grid24code(){
		let width = this.viewSize.width;
		console.log("size", this.viewSize)
		if( width ){
			if( width < 768 ){
				return 'xs';
			}else{
				let arr = [];
				if( width >=768 ){
					arr.push('sm');
				}
				if( width >=992 ){
					arr.push('md');
				}
				if( width >=1200 ){
					arr.push('lg');
				}
				if( width >=1920 ){
					arr.push('xl');
				}
				return arr.join(' ');
			}
		}
		return '';
	}
	static getInstance(){
		if( !Devices.instance ){
			Devices.instance = new Devices();
		}
		return Devices.instance;
	}
}

export default Devices;