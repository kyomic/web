import EventEmitter from 'event-emitter'
import DevicesType from './consts/DevicesType'
import utils from './utils'


class Devices{
	constructor(){
		this._context = null;
		EventEmitter( this );

		this.evtOnResize = this.onResize.bind( this );
		this.evtOnLoad = this.onLoad.bind( this );
	}

	query( selector ){
		if( this.context ){
			let doc = this.context.document;
			if( doc ){
				return doc.querySelector( selector );
			}
		}
		return null;
	}
	/**
	 * 父容器是否包含子容器
	 * @param {DOM} parent - 父容器
	 * @param {DOM} child - 子容器
	 * @return {boolean}
	 */
	containDom( parent, child ){
		if( child == parent ){
	        return true;
	    }
	    let p = child.parentNode;
	    while(p){
	        if( p == parent ){
	            return true;
	        }
	        p = p.parentNode;
	    }
	    return false;
	}

	/**
	 * 简单的事件代理
	 * @param {DOM} target - 被代理的DOM
	 
	 * @param {string} selector - css选择器
	 * @param {string} evt - 事件类型
	 * @param {function} handler - 事件回调函数
	 */
	delegate( target, selector, evt , handler ){
	    let id = utils.stringhash( target.nodeName + target.id + evt + selector );
	    if( !target.__evtMap ){
	        target.__evtMap = {};
	    }
	    target.__evtMap[ id ] = (e)=>{
	        let tar = e.target;
	        console.log(e)
	        if( this.containDom(target, tar)){
	            if( handler.call(tar, e) === false ){
	                e.stopPropagation();
	                try{
	                    e.cancelBubble = true;
	                }catch(e){}
	            }
	        }
	    }
	    console.log(target, selector)
	    target.addEventListener(evt, target.__evtMap[ id ]);
	}

	undelegate( target, evt, selector ){
	    let id = utils.stringhash( target.nodeName + target.id + evt + selector );
	    if( target.__evtMap ){
	       let handler = target.__evtMap[ id ];
	       if( handler ){
	           target.removeEventListener(evt, handler );
	       }
	    }
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

	get runtimeType(){
		if( this._context ){

		}
		return DevicesType.BROWSER;
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

	get currentPage(){
		return {
			url:location.href
		}
	}
	
	static getInstance(){
		if( !Devices.instance ){
			Devices.instance = new Devices();
		}
		return Devices.instance;
	}
}

export default Devices;