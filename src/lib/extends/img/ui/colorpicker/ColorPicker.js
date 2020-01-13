import { HueBox, ColorBox } from './ColorBox';
import Color from '../../Color.js';
import dom from '@/lib/core/dom'
import './style.less';
/**
 * 
 * @mode 面板上显示显示的主要内容  color(颜色模式),hvs(色相/亮度模式),hsv(色相/饱和度模式), r(R分量),g(G分量),b(B分量),disk(色盘模式)
 * see:http://www.dematte.at/colorPicker/
 */
class ColorPicker{
	static HUE_MAP = [
		{color:'#FF0000',percent:0},
		{color:'#FFFF00',percent:1/6},
		{color:'#00FF00',percent:2/6},
		{color:'#00FFFF',percent:3/6},
		{color:'#0000FF',percent:4/6},
		{color:'#FF00FF',percent:5/6},
		{color:'#FF0000',percent:1}
	]
	/** 
	 * 绘制类PS的 R,G,B混色层
	 * @param {string} channel - 可选r,g,b三个通道类型
	 * @param {number} w - 绘制宽度
	 * @param {number} h - 绘制高度
	 * @param {boolean} revert - 是否反转，反转图片为非反转层的遮照层
	 */
	static RGB_LAYER = ( channel, w, h, revert=false ) =>{
		let canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		let ctx = canvas.getContext('2d');
		var imagedata = ctx.createImageData(w, h);
		// 给对应坐标位置的数据设置色值为绿色
		let color = [255,255,255];
		let targetColor = [];
		let startX = 0;
		let startY = 0;
		let offsetX = 255/w;
		let offsetY = 255/h;

		let decIndex = 0,
			addIndex = 0,
			staIndex = 0;//静态不变位
		//R // G  00FF00, B: 0000FF   BGRBGR
		//G // R  FF0000, B: 0000FF
		//B // G  00FF00, R: FF0000
		switch( channel ){
			case 'r':
				color = revert ? [255,255,0]:[0,255,0];
				staIndex = 0;
				decIndex = 1;
				addIndex = 2;
				break;
			case 'g':
				color = revert ? [255,255,0]:[255,0,0];
				staIndex = 1;
				decIndex = 0;
				addIndex = 2;
				break;
			case 'b':
				color = revert? [0,255,255]:[0,255,0];
				staIndex = 2;
				decIndex = 1;
				addIndex = 0;
				break;

		}
		for (var x = 0; x < w*4; x+=4) {
		    for (var y = 0; y < h*4; y+= 4) {
		        var index = (x + y * w) * 1;
		        // 变为绿色，色值依次是0, 128, 0, 256
		        imagedata.data[index + staIndex ] = color[staIndex];
	        	imagedata.data[index + decIndex ] = color[decIndex] - y * (offsetX/4);
	        	imagedata.data[index + addIndex ] = color[addIndex] + x * (offsetX/4);
		        imagedata.data[index + 3] = 255;
		    }
		}
		// 再重绘
		ctx.putImageData(imagedata, 0, 0);
		return canvas;
	}
	
	static R_LAYER = ( w, h ) =>{
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		var imagedata = ctw.createImageData(w, h);
		// 给对应坐标位置的数据设置色值为绿色
		let r0 = 255;
		let g0 = 0;
		let b0 = 0;
		for (var x = 0; x < w*4; x+=4) {
		    for (var y = 0; y < h*4; y+= 4) {
		        var index = (x + y * w) * 1;
		        // 变为绿色，色值依次是0, 128, 0, 256
		        let r=0,g=0,b=0;
		        r = Math.round(r0 - y * (255/h/4));
		        b = Math.round(b0 + x * (255/w/4));
		        imagedata.data[index] = r;
		        imagedata.data[index + 1] = g;
		        imagedata.data[index + 2] = b;
		        imagedata.data[index + 3] = 255;
		    }
		}
		// 再重绘
		ctw.putImageData(imagedata, 0, 0);
	}


	constructor( option ){
		this._color = option.color || new Color("#FF0000");
		this._parent = option.root || document.body;
		this._mode = option.mode;
		this._isDotDragging = false;
		this._initialize();
		this._colorSpace = 'hsv';
		this._rgb = {};
		this._hsv = null;
		//view中小点的坐标	
		this._xPos = 0;
		this._yPos = 0;
		this.mode = 'disk';
		this.color = this._color;
	}
	_initialize(){
		this._colorViewWidth = 100;
		this._colorViewHeight = 100;
		//this.hubox = new HueBox()
		this._root = document.createElement('div');
		this._textWrap = document.createElement('div');
		this._view = document.createElement('canvas');
		this._viewWrap = document.createElement('div');
		this._bar = document.createElement('canvas');

		this._barWrap = document.createElement('div');
		this._dot = document.createElement('div');
		this._dot.className = 'dot'
		this._conner = document.createElement('div');
		this._conner.className = 'conner';
		this._root.appendChild( this._textWrap );
		this._root.appendChild( this._barWrap );
		this._root.appendChild( this._viewWrap);

		this._viewWrap.appendChild( this._view );
		this._viewWrap.appendChild( this._dot );

		this._barWrap.appendChild( this._conner );
		this._barWrap.appendChild( this._bar );

		//rgb混色
		this._rgblayer = {};
		let c = ['r','g','b']
		for(var i=0;i<3;i++){
			this._rgblayer[ c[i] ] = ColorPicker.RGB_LAYER( c[i], this._colorViewWidth, this._colorViewHeight );
			this._rgblayer[ c[i]+"_mask" ] = ColorPicker.RGB_LAYER( c[i], this._colorViewWidth, this._colorViewHeight, true );
		}

		this._parent.appendChild( this._root );
		this.layout();
		this.draw();

		this.onViewWrapEvent = this.onViewWrapEventHandler.bind( this );
		this.onBarWrapEvent = this.onBarWrapEventHandler.bind( this );
		this.attachEvent();
	}
	onBarWrapEventHandler( e ){
		let h = this._colorViewHeight;
		switch( e.type ){
			case 'mousedown':
				this._isBarDragging = true;
				document.addEventListener('mousemove', this.onBarWrapEvent );
				document.addEventListener('mouseup', this.onBarWrapEvent );
				break;
			case 'mousemove':
				let {clientX, clientY} = e;
				let offset = dom.offset( this._viewWrap);
				let offsetY = clientY - offset.top;
					offsetY = Math.min( h, Math.max(0, offsetY));
				if( this._isBarDragging ){
					switch( this._mode ){
						case 'color':
							this._hsv.h = Math.round((1-offsetY/h) * 360);
							break;
						case 'hsv':
							//x为hue,y为saturation
							this._hsv.s = 1-offsetY / h;
							break;
						case 'hvs':
							//x为hue,y为brightness
							this._hsv.v = 1-offsetY / h;
							break;
						case 'disk':
							this._hsv.v = 1-offsetY / h;
							break;
						case 'r':
						case 'g':
						case 'b':
							this._rgb[this._mode] = Math.round( (1-offsetY / h ) * 255);
							if( this._rgbMask ){
								dom.setStyle( this._rgbMask, {opacity: 1-offsetY/h})
							}
							break;
					}					
					dom.setStyle( this._conner, {top:offsetY+'px'});					
					this.updateColor();
					this.draw();
				}
				
				break;
			case 'mouseup':
				document.removeEventListener('mousemove', this.onBarWrapEvent );
				document.removeEventListener('mouseup', this.onBarWrapEvent );
				break;
		}
	}
	onViewWrapEventHandler( e ){
		let w = this._colorViewWidth;
		let h = this._colorViewHeight;
		let angle = 0;
		let radius  = w/2;
		switch( e.type ){
			case 'mousedown':
				this.onDragTarget( this._viewWrap , true )
				this._isDotDragging = true;
				document.addEventListener('mousemove', this.onViewWrapEvent );
				document.addEventListener('mouseup', this.onViewWrapEvent );
				break;
			case 'mousemove':				
				let {clientX, clientY} = e;
				let offset = dom.offset( this._viewWrap);
				let offsetX = clientX - offset.left,
					offsetY = clientY - offset.top;
					offsetX = Math.min( w, Math.max(0, offsetX));
					offsetY = Math.min( h, Math.max(0, offsetY));

				this._xPos = offsetX;
				this._yPos = offsetY;
				if( this._isDotDragging ){
					switch( this._mode ){
						case 'color':
							this._hsv.s = offsetX / w;
							this._hsv.v = 1-offsetY / h;
							break;
						case 'hsv':
							this._hsv.h = Math.round( offsetX / w * 360);
							this._hsv.v = 1-offsetY / h;
							break;
						case 'hvs':
							this._hsv.h = Math.round( offsetX / w * 360);
							this._hsv.s = 1-offsetY / h;
							break;
						case 'disk':
							let distX = Math.abs( offsetX - w/2);
							let distY = Math.abs( offsetY - h/2);

							angle = Math.atan( (offsetY- w/2)/(offsetX-h/2));
							let c = angle;
							if( offsetY < h/2 ){
								if( angle < 0 ){
									c += Math.PI*2
								}else{
									c =  Math.PI + angle;
								}
							}else{
								if( angle <0 ){
									c += Math.PI+ angle;
								}
							}
							this._hsv.s = Math.sqrt( distX * distX + distY*distY)/ w/2;
							this._hsv.h = Math.round(360-c/(Math.PI*2)*360);
							break;
						case 'r':
							this._rgb.b = Math.round( offsetX / h * 255);
							this._rgb.g = Math.round( (1-offsetY / h) * 255);
							break;
						case 'g':
							this._rgb.b = Math.round( offsetX / h * 255);
							this._rgb.r = Math.round( (1-offsetY / h) * 255);
							break;
						case 'b':
							this._rgb.r = Math.round( offsetX / h * 255);
							this._rgb.g = Math.round( (1-offsetY / h) * 255);
							break;
					}

					if( this._mode == 'disk'){						
						let distX = Math.abs( offsetX - w/2);
						let distY = Math.abs( offsetY - h/2);
						if( Math.sqrt(distX*distX + distY*distY)>w/2){
							angle = Math.atan( (offsetY- w/2)/(offsetX-h/2));
							//console.log( "angle", angle * Math.PI, angle)
							//console.log(Math.sin(angle), Math.cos(angle))
							if( angle > 0 ){
								//2,4像限
								if( offsetX > radius ){
									offsetY = radius + Math.sin(angle) * radius;
									offsetX = radius + Math.cos(angle) * radius;
								}else{
									offsetY = radius - Math.sin(angle) * radius;
									offsetX = radius - Math.cos(angle) * radius;
								}
							}else{
								//1,3
								if( offsetX > radius ){
									offsetY = radius + Math.sin(angle) * radius;
									offsetX = radius + Math.cos(angle) * radius;
								}else{
									offsetY = radius - Math.sin(angle) * radius;
									offsetX = radius - Math.cos(angle) * radius;
								}
							}

						}
					}
					dom.setStyle( this._dot, {left:offsetX+'px',top:offsetY+'px'})
					
					this.updateColor();
					this.draw();
				}
				
				break;
			case 'mouseup':
				document.removeEventListener('mousemove', this.onViewWrapEvent );
				document.removeEventListener('mouseup', this.onViewWrapEvent );
				this.onDragTarget( this._viewWrap , false );
				break;
		}
	}

	onDragTarget( target, dragging ){
		if( dragging ){
			dom.setStyle( document.body, {"cursor":"none"})
		}else{
			dom.setStyle( document.body, {"cursor":"default"})
		}
	}

	attachEvent(){
		this._viewWrap.addEventListener( 'mousedown', this.onViewWrapEvent );
		this._barWrap.addEventListener( 'mousedown', this.onBarWrapEvent );
	}

	set color( c ){
		this._color = c;
		this._hsv = Color.RGB2HSV( this.color.rgba );
		this._rgb = this.color.rgba;
		console.log("hsv",this._hsv)
		this.draw();
		this.updateColor();
	}
	get color(){
		return this._color;
	}

	set mode( value ){
		if( this._mode != value && ['r','g','b'].indexOf( value )!=-1 ){
			this._colorSpace = 'rgb';
			this.createRGBViewLayer( value );
		}else{
			this._colorSpace = 'hsv';
		}
		this._mode = value;
		this.draw();
	}

	get mode(){
		return this._mode
	}

	createRGBViewLayer( mode ){
		let c = ['r','g','b']
		for(var i=0;i<3;i++){
			try{
				this._viewWrap.removeChild( this._rgblayer[c[i]] );
				this._viewWrap.removeChild( this._rgblayer[c[i]+"_mask"] );
			}catch(e){}
		}
		console.log("this._rgblayer[ mode ]",this._rgblayer[ mode ])
		dom.setStyle( this._rgblayer[ mode ], {'position':'absolute','left':0,'top':0})
		dom.setStyle( this._rgblayer[ mode+"_mask" ], {'position':'absolute','left':0,'top':0})
		this._viewWrap.appendChild( this._rgblayer[ mode ] );
		this._viewWrap.appendChild( this._rgblayer[ mode + "_mask" ] );

		this._viewWrap.appendChild( this._dot );
		this._rgbMask = this._rgblayer[ mode+"_mask" ];
	}

	updateColor(){
		this._color.color = this._colorSpace == 'hsv' ? this._hsv : this._rgb;
		this._textWrap.innerHTML = this._color.hexString + "  " + [this._hsv.h,this._hsv.s,this._hsv.v].join(",")
		dom.setStyle( this._textWrap, {'background':this._color.hexString, 'width':this._colorViewWidth+"px"})
	}
	layout(){
		this._root.style.cssText = "position:relative;height:200px;";
		this._view.width = this._colorViewWidth;
		this._view.height = this._colorViewHeight;
		this._viewWrap.style.cssText = 'position:absolute;left:0;top:50px';
		this._bar.width = 10;
		this._bar.height = this._colorViewHeight;
		this._barWrap.style.cssText = 'position:absolute;left:'+( this._colorViewWidth +10) + 'px;top:50px';
		this._dot.style.cssText = 'position:absolute;left:0;top:0;width: 6px;height: 6px;border-radius: 6px;box-shadow: rgb(255, 255, 255) 0px 0px 0px 1px inset;transform: translate(-4px, -4px);border:1px solid #000;';
	}

	draw(){
		if( !this._hsv ) return;
		let ctw = this._view.getContext('2d');
		let cbw = this._bar.getContext('2d');
		let w = this._colorViewWidth;
		let h = this._colorViewHeight;
		
		ctw.clearRect(0,0,w, h);
		let gradient = ctw.createLinearGradient(0, 0, w, 0);
		ColorPicker.HUE_MAP.map(res=>{
			gradient.addColorStop(res.percent, res.color )
		})
		ctw.fillStyle = gradient;
		// 左上角和右下角分别填充2个矩形
		ctw.fillRect(0, 0, w, h );

		let alpha = 1-this._hsv.v;
		let brightness = Math.round(255 * this._hsv.v);
		switch( this._mode ){
			case 'color':
				//draw color view
				//颜色层
				let {r,g,b} = Color.HSV2RGB( {h:this._hsv.h, s:1,v:1} );	
				let gradient = ctw.createLinearGradient(0, 0, w, 0);
				gradient.addColorStop(0, `rgba(255,255,255,1)`);
				gradient.addColorStop(1, `rgba(${r},${g},${b},1)` );
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				//灰色层
				gradient = ctw.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, `rgba(0,0,0,0)`);
				gradient.addColorStop(1, `rgba(0,0,0,1)` );
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				break;
			//亮度面板
			case 'hvs':	
				//饱和度锁定				
				brightness = Math.round(255 * this._hsv.v)
				gradient = ctw.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, `rgba(255,255,255,0)`);
				gradient.addColorStop(1, `rgba(255,255,255,1)`);
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				alpha = 1- this._hsv.v;
				gradient = ctw.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
				gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				break;
			case 'hsv':
				//亮度锁定
				alpha = 1- this._hsv.s;
				//饱和度
				gradient = ctw.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, `rgba(255,255,255,0)`);
				gradient.addColorStop(1, `rgba(0,0,0,1)`);
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				//黑白
				gradient = ctw.createLinearGradient(0, 0, 0, h);
				gradient.addColorStop(0, `rgba(255,255,255,${1-this._hsv.s})`);
				gradient.addColorStop(1, `rgba(0,0,0,${1-this._hsv.s})`);
				ctw.fillStyle = gradient;
				ctw.fillRect(0, 0, w, h );
				break;
			case 'disk':
				ctw.clearRect(0, 0, w, h );
				let coords = [w/2,h/2];
				var x = coords[0] || coords, // coordinate on x-axis
					y = coords[1] || coords, // coordinate on y-axis
					a = w/2, // radius on x-axis
					b = h/2, // radius on y-axis
					angle = 360,
					rotate = 0, coef = Math.PI / 180;
				ctw.save();
				ctw.translate(x - a, y - b);
				ctw.scale(a, b);
				let steps = 1;
				for (; angle > 0 ; angle -= steps){
					ctw.beginPath();
					if (steps !== 360) ctw.moveTo(1, 1); // stroke
					ctw.arc(1, 1, 1,
						(angle - (steps / 2) - 1) * coef,
						(angle + (steps / 2) + 1) * coef);
					if (true) {
						gradient = ctw.createRadialGradient(1, 1, 1, 1, 1, 0);
						gradient.addColorStop(0, 'hsl(' + (360 - angle + 0) + ', 100%, 50%)');
						gradient.addColorStop(1, "#FFFFFF");
						ctw.fillStyle = gradient;
						ctw.fill();
					} else {
						ctw.fillStyle = 'black';
						ctw.fill();
					}
				}
				ctw.restore();
				ctw.arc(a, b, a, 0, coef*360);
				ctw.fillStyle = `rgba(0,0,0,${1-this._hsv.v})`;
				ctw.fill();
				break;	
		}
		gradient = cbw.createLinearGradient(0, 0, 0, h )
		console.log("hsv", this._hsv,"mode", this.mode)
		let rgb = Color.HSV2RGB( this._hsv );
		switch( this._mode ){
			case "color":
				//draw hue bar
				gradient = cbw.createLinearGradient(0, w, 0, 0 );
				ColorPicker.HUE_MAP.map(res=>{
					gradient.addColorStop(res.percent, res.color )
				})
				cbw.fillStyle = gradient;
				// 左上角和右下角分别填充2个矩形
				cbw.fillRect(0, 0, 0, h );
				break;
			case "hvs":
				//draw hue bar					
				gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
				gradient.addColorStop(1, `rgba(0,0,0,1)`);
				break;
			case "hsv":	
				//ps里v好像增加了0.5
				rgb = Color.HSV2RGB( {h:this._hsv.h, s:this._hsv.s,v:this._hsv.v+0.5} );			
				alpha = Math.round(this._hsv.v*255);
				console.log("alpha",alpha)
				gradient = cbw.createLinearGradient(0, 0, 0, h )
				gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
				gradient.addColorStop(1, `rgba(255,255,255,${this._hsv.v})`);
				//gradient.addColorStop(1, `rgba(${alpha},${alpha},${alpha},0.5)`);
				cbw.fillStyle = gradient;
				cbw.fillRect(0, 0, 10, h );
				gradient = cbw.createLinearGradient(0, 0, 0, h )
				gradient.addColorStop(0, `rgba(128,128,128,0)`);
				gradient.addColorStop(1, `rgba(128,128,128,${0.5-this._hsv.v})`);
				break;
			case "disk":
				//Y轴为 V(HSV)
				//draw hue bar			
				rgb = Color.HSV2RGB( {h:this._hsv.h, s:this._hsv.s,v:1} );
				gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},1)`);
				gradient.addColorStop(1, `rgba(0,0,0,1)`);
				cbw.fillStyle = gradient;
				cbw.fillRect(0, 0, 10, h );
				break;
			case 'r':
				//0x000000 - 0xFF0000(红底)
				//0x0000FF - 0xFF00FF(蓝-绿对比色( 紫))  x轴
				//0x00FFFF - 0xFFFFFF(对比色的白面)  1-y轴
			case 'g':
				//0x000000 - 0x00FF00(绿底)
				//0x0000FF - 0x00FFFF(蓝-红对比色(青))
				//0xFF00FF - 0xFFFFFF(对比色的白面)
			case 'b':
				//0x000000 - 0x00FF00(绿底)
				//0xFF0000 - 0xFF00FF(红- 绿对比色( 紫))
				//0xFF00FF - 0xFFFFFF(对比色的白面)
				let channel = [{r:255,g:0,b:0},{r:0,g:255,b:0},{r:0,g:0,b:255}];
				let g = [
					[{r:255,g:0,b:255},{r:0,g:0,b:255}],
					[{r:0,g:255,b:255},{r:0,g:0,b:255}],
					[{r:255,g:0,b:255},{r:255,g:0,b:0}]
				];
				let idx = ['r','g','b'].indexOf(this._mode);
				gradient = cbw.createLinearGradient(0, 0, 0, h )				
				gradient.addColorStop(0, `rgba(${channel[idx].r},${channel[idx].g},${channel[idx].b},1)`);
				gradient.addColorStop(1, `rgba(0,0,0,1)`);
				cbw.fillStyle = gradient;
				cbw.fillRect(0, 0, 10, h );

				let a = 0,b = 0;
				let pos = [this._xPos/w, 1-this._yPos/h];				
				if( pos[0] > pos[1] ){
					b = 1;
				}else{
					a = 1;
					g[0] = [{r:255,g:255,b:0},{r:0,g:255,b:0}];
					g[1] = [{r:255,g:255,b:0},{r:255,g:0,b:0}];
					g[2] = [{r:0,g:255,b:255},{r:0,g:255,b:0}];
				}
				let x = pos[a];
				let y = pos[b];
				let xAlpha = (x - y) / (1 - y) || 0;
				let yAlpha = y;
				//console.log("xAlpha",xAlpha,yAlpha,g[idx][0], g[idx][1] )
				gradient = cbw.createLinearGradient(0, 0, 0, h )
				gradient.addColorStop(0, `rgba(${g[idx][0].r},${g[idx][0].g},${g[idx][0].b},${xAlpha})`);
				gradient.addColorStop(1, `rgba(${g[idx][1].r},${g[idx][1].g},${g[idx][1].b},${xAlpha})`);
				cbw.fillStyle = gradient;
				cbw.fillRect(0, 0, 10, h );
				
				gradient = cbw.createLinearGradient(0, 0, 0, h )
				gradient.addColorStop(0, `rgba(255,255,255,${yAlpha})`);
				gradient.addColorStop(1, `rgba(${255-channel[idx].r},${255-channel[idx].g},${255-channel[idx].b},${yAlpha})`);
				
				cbw.fillStyle = gradient;
				cbw.fillRect(0, 0, 10, h );
				break;
		}
		cbw.fillStyle = gradient;
		// 左上角和右下角分别填充2个矩形
		cbw.fillRect(0, 0, 10, h );
	}
}

export default ColorPicker;
export { ColorPicker }