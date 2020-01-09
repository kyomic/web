//NB 
//see: http://www.fmwconcepts.com/imagemagick/index.php

import BitmapDataFilter from './BitmapDataFilter';
import BitmapFilterFunction from './BitmapFilterFunction';
class BitmapFilter{
	static gray( {level} = {level:3} ){
		let opt = {level};
		return new BitmapFilter( BitmapDataFilter.gray, opt, [{
			name:"level", type:"number",min:0,max:1,value:0.5,default:0.5
		}], "灰度滤镜");
	}
	static gaussBlur( option ){
		return new BitmapFilter( BitmapDataFilter.gaussBlur, option, [{
			name:"radius", type:"number",min:0.5,max:250,value:0.5,default:0.5
		}], "高斯模糊滤镜");
	}
	static gaussStackBlur( option ){
		return new BitmapFilter( BitmapDataFilter.stackBlur, option, [{
			name:"radius", type:"number",min:0,max:180,value:0.5,default:0
		}], "快速高斯模糊滤镜");
	}
	static convolution( option ){
		return new BitmapFilter( BitmapDataFilter.convolution,option,[],"卷积滤镜" );
	}
	static sepia(){
		return new BitmapFilter( BitmapDataFilter.sepia,null,[],"一种复古效果" );
	}
	static ice(){
		return new BitmapFilter( BitmapDataFilter.ice, null, [], "冰冻效果" );
	}
	static revert(){
		return new BitmapFilter( BitmapDataFilter.revert, null, [], "反转色/底片效果" );
	}

	static mosaic( option = null ){
		return new BitmapFilter( BitmapDataFilter.mosaic, option, [{
			name:"size", type:"number",min:0,max:100,value:5,default:5
		}], "马骞格效果" );
	}

	static test(){
		return new BitmapFilter( BitmapDataFilter.mosaic,null );
	}
	constructor( filter, option = null, config = null, description = ""){
		this.filter = filter;
		this.filterOption = option;
		this.config = config;
		this.description = description;
	}

	render( bitmap ){
		return this.filter( bitmap, this.filterOption );
	}

}

let filters =Object.getOwnPropertyDescriptors( BitmapFilter );
let BitmapFilterDescription = [];
for(var name in filters){
	let defaultProps = ["name","prototype","length","constructor"];
	if( defaultProps.indexOf(name)==-1){
		let filter = BitmapFilter[ name ]();
		let item = { name: name, description: filter.description, filter:BitmapFilter[ name ], args:filter.config }
		BitmapFilterDescription.push( item );
	}
}
export default BitmapFilter;
export {
	BitmapFilter,
	BitmapFilterDescription
}