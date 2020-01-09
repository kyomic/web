import Color from '../../Color.js';
class HueBox{
	constructor( option ){
		let {width, height, horizontal = true } =  option || {};
		let canvas = document.createElement("canvas");
		let context = canvas.getContext('2d');
		//canvas.width = width;
		//canvas.height = height;
		if( width ) {
			canvas.width = width;
		}
		if( height ){
			canvas.height = height;
		}
		this._width = canvas.width;
		this._height = canvas.height;
		this._canvas = canvas;
		let gradient = horizontal ? context.createLinearGradient(0, 0, this.width, 0): context.createLinearGradient(0, 0, 0, this.height )
		let map = [
			{c:'#FF0000',p:0},
			{c:'#FFFF00',p:0.17},
			{c:'#00FF00',p:0.33},
			{c:'#00FFFF',p:0.50},
			{c:'#0000FF',p:0.67},
			{c:'#FF00FF',p:0.83},
			{c:'#FF0000',p:1}
		];
		map.map(res=>{
			gradient.addColorStop(res.p, res.c )
		})
		context.fillStyle = gradient;
		// 左上角和右下角分别填充2个矩形
		context.fillRect(0, 0, this.width, this.height );
	}
	get width(){
		return this._width
	}
	get height(){
		return this._height;
	}

	get view(){
		return this._canvas;
	}
}
/** 
 * 水平为S(饱和度),垂直为B(亮度)
 */
class ColorBox{
	constructor( option ){
		let {width, height, color } =  option || {};
		let canvas = document.createElement("canvas");
		let context = canvas.getContext('2d');
		if( width ) {
			canvas.width = width;
		}
		if( height ){
			canvas.height = height;
		}
		this._width = canvas.width;
		this._height = canvas.height;
		
		this._canvas = canvas;
		this.context = this._canvas.getContext('2d');
		this.color = color || new Color();
	}
	set color( c ){
		this._color = c;
		this.draw();
	}
	get color(){
		return this._color
	}
	draw(){
		let gradient = this.context.createLinearGradient(0, 0, this.width, 0);
		gradient.addColorStop(0,"#FFFFFF");
		gradient.addColorStop(1, this.color.rgbString );
		this.context.fillStyle = gradient;
		// 左上角和右下角分别填充2个矩形
		this.context.fillRect(0, 0, this.width, this.height );

		gradient = this.context.createLinearGradient(0, 0, 0, this.height);
		gradient.addColorStop(0, 'rgba(0,0,0,0)');
		gradient.addColorStop(1, 'rgb(0,0,0)' );
		this.context.fillStyle = gradient;
		this.context.fillRect(0, 0, this.width, this.height );
	}
	get width(){
		return this._width
	}
	get height(){
		return this._height;
	}

	get view(){
		return this._canvas;
	}
}
export {
	HueBox,
	ColorBox
}