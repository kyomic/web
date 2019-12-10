let dom = {}
dom.closet = (el, selector)=>{
    var matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;
    while (el) {
        if (matchesSelector.call(el, selector)) {
            break;
        }
        el = el.parentElement;
    }
    return el;
}

dom.query = ( el, selector )=>{
	return selector.querySelector( el );
}

dom.hasClass = ( el, name )=>{
	return !!el.className.match( new RegExp( "(\\s|^)" + name + "(\\s|$)") ); 
}

dom.addClass = ( el, name )=>{
	if( ! dom.hasClass(el, name )){
		el.className += ' ' + name;
	}
  return dom;
}

dom.removeClass = ( el, name )=>{
	if( dom.hasClass( el, name )){
		el.className = el.className.replace( new RegExp( "(\\s|^)" + name + "(\\s|$)" )," " ); 
	}
}

//ant design 
dom.offset2 = ( el ) =>{
  let x = 0;
  let y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop )){
    x += el.offsetLeft - el.scrollLeft;
    y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return {top:y, left:x};
}
dom.offset = ( el, offset )=>{
  if( !offset ){
    offset = { top :0, left : 0 }
  }
  if( el == document.body ){
    return offset;
  }
  offset.top += el.offsetTop;
  offset.left += el.offsetLeft;
  return dom.offset( el.parentNode, offset );
}

dom.position = ( el )=>{
  return {
      top: el.offsetTop,
      left: el.offsetLeft,
  }
} 

dom.getStyle = ( el, attr )=>{
	var val=null,reg=null;//新建正则筛选
   	if("getComputedStyle" in window){
   		val=window.getComputedStyle( el ,null)[attr];
   	}else{
   		//IE6~8兼容opacity
   		if(attr==="opacity"){
   			val= el.currentStyle["filter"];
   			reg=/^alpha\(opacity=(\d+(?:\.\d+)?)\)$/i;
   			val=reg.test(val)?reg.exec(val)[1]/100:1;
   		}else{
   			val= el.currentStyle[attr];
   		}
   		
   	}
   	
   	reg=/^(-?\d+(\.\d+)?)(px|pt|rem|em)?$/i;//不属于这个规则的不去除单位。
   	return reg.test(val)?parseFloat(val):val;
}

dom.setStyle = ( el, styles, props )=>{
	if( typeof styles =='string'){
		let obj = {}
		obj[styles] = props;
		styles = obj;
	}
	for (var style in styles) {
        el.style.setProperty(style, styles[style]);
    }
}

dom.toggleDisplay = (el)=>{
	let style = dom.getStyle( el, 'display');
	if( style == 'none'){
		dom.setStyle( el, 'display','block');
	}else{
		dom.setStyle( el, 'display', 'none');
	}
}
export default dom;
export {dom};