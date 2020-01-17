import EventEmitter from 'event-emitter'
import DevicesType from './consts/DevicesType'
import utils from './utils'
import Debug from '../debug'

class Devices{
	constructor(){
		this._context = null;
		EventEmitter( this );

		this.evtOnResize = this.onResize.bind( this );
		this.evtOnLoad = this.onLoad.bind( this );
		this.evtOnScroll = this.onScroll.bind( this );
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
	        if( this.containDom(target, tar)){
	            if( handler.call(tar, e) === false ){
	                e.stopPropagation();
	                try{
	                    e.cancelBubble = true;
	                }catch(e){}
	            }
	        }
	    }
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

	get scrollPosition(){
		if( this.context ){
			let doc = document,
	        body = doc.body,
	        html = doc.documentElement;
	        return {
	        	x: html.scrollLeft || body.scrollLeft,
	        	y: html.scrollTop || body.scrollTop
	        }
		}
		return {x:0,y:0};
	}

	get performaceStack(){
		let per = window.performance;
		if( per ){
			var t = per.getEntriesByType("navigation")[0]
              , r = 0;
            t || (r = (t = per.timing).navigationStart);
            var n = [{
                key: "Redirect",
                desc: "\u7f51\u9875\u91cd\u5b9a\u5411\u7684\u8017\u65f6",
                value: t.redirectEnd - t.redirectStart
            }, {
                key: "AppCache",
                desc: "\u68c0\u67e5\u672c\u5730\u7f13\u5b58\u7684\u8017\u65f6",
                value: t.domainLookupStart - t.fetchStart
            }, {
                key: "DNS",
                desc: "DNS\u67e5\u8be2\u7684\u8017\u65f6",
                value: t.domainLookupEnd - t.domainLookupStart
            }, {
                key: "TCP",
                desc: "TCP\u8fde\u63a5\u7684\u8017\u65f6",
                value: t.connectEnd - t.connectStart
            }, {
                key: "Waiting(TTFB)",
                desc: "\u4ece\u5ba2\u6237\u7aef\u53d1\u8d77\u8bf7\u6c42\u5230\u63a5\u6536\u5230\u54cd\u5e94\u7684\u65f6\u95f4 / \u9996\u5305\u65F6\u95F4",
                value: t.responseStart - t.requestStart
            }, {
                key: "Content Download",
                desc: "\u4e0b\u8f7d\u670d\u52a1\u7aef\u8fd4\u56de\u6570\u636e\u7684\u65f6\u95f4",
                value: t.responseEnd - t.responseStart
            }, {
                key: "HTTP Total Time",
                desc: "http\u8bf7\u6c42\u603b\u8017\u65f6",
                value: t.responseEnd - t.requestStart
            }, {
                key: "DOMContentLoaded",
                desc: "dom\u52a0\u8f7d\u5b8c\u6210\u7684\u65f6\u95f4",
                value: t.domContentLoadedEventEnd - r
            }, {
                key: "Loaded",
                desc: "\u9875\u9762load\u7684\u603b\u8017\u65f6",
                value: t.loadEventEnd - r
            }];
            console.log(t)
            return n;
		}
		return [];
	}

	
	// 阻止双击放大
	preventZoomPage(){
		let doc = this._context.document;		
	    var lastTouchEnd = 0;
	    doc.addEventListener('touchstart', function(event) {
	        if (event.touches.length > 1) {
	            event.preventDefault();
	        }
	    });
	    doc.addEventListener('touchend', function(event) {
	        var now = (new Date()).getTime();
	        if (now - lastTouchEnd <= 300) {
	            event.preventDefault();
	        }
	        lastTouchEnd = now;
	    }, false);
		
	    // 阻止双指放大
	    doc.addEventListener('gesturestart', function(event) {
	        event.preventDefault();
	    });
	}

	onResize(){
		this.emit('resize', {type:'resize', data: this.viewSize });
	}
	onLoad(){
		//会导致vue mounted 2次
		this.emit('load', {type:'load', data: this.viewSize });
		let p = this.performaceStack;
		console.log(p);
		//阻止双击放大
		this.preventZoomPage()
	}
	onScroll(){
		let data = {
			scrollTop: this.scrollPosition.y,
			clientHeight: this.viewSize.height,
			scrollHeight: this.scrollSize.height
		}
		this.emit('scroll',{type:'scroll', data })
		//Debug.console("scrollTop:"+ data.scrollTop+",clH="+ data.clientHeight+",scrollH="+data.scrollHeight)
		let offset = 50;

		if( data.scrollTop + data.clientHeight >= data.scrollHeight - offset ){
			this.emit('reachbottom', {type:'reachbottom', data })
		}
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

			if( this._context.document ){
				this._context.document.addEventListener('scroll', this.evtOnScroll )
			}
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
		var ua = navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == "micromessenger") {
            return DevicesType.WX;
        }
		return DevicesType.BROWSER;
	}
	/**
	 * 返回 24栅格的代码，如：xs(<768)、sm(>=768)、md(>=992)、lg(>=1200) 和 xl(>=1920)
	 * @member
	 */
	get grid24code(){
		let width = this.viewSize.width;
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