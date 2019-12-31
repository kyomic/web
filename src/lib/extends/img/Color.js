/** 
 * 简单的颜色处理类
 * @author kyomic
 * @mail kyomic@163.com
 * @version 0.0.1
 *
 * @example
 * let c = new Color("#FF0000");
 * console.log(c.rgbstring); // rgba(255,0,0,1)
 * c.color = {r:0,g:255,b:0};
 * console.log(c.rgbstring); // rgba(0,255,0,1)
 */
class Color{
	static REGEXP_RGB = /^#?([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/;
	constructor( obj ){
		this._hexstring = "#000000";
		this._alpha = 1;
		if( obj ){
			this.color = obj;
		}
	}

	/**
	 * RGB 颜色值转换为 HSL(色相，饱和度，亮度)
	 * 转换公式参考自 http://en.wikipedia.org/wiki/HSL_color_space.
	 * r, g, 和 b 需要在 [0, 255] 范围内
	 * 返回的 s, 和 l 在 [0, 1] 之间, h在 [0,360间]
	 *
	 * @param   Number  r       红色色值
	 * @param   Number  g       绿色色值
	 * @param   Number  b       蓝色色值
	 * @return  Array           HSL各值数组
	 */
	 
	static RGB2HSL( {r, g, b} = rgb )  {
	    r /= 255, g /= 255, b /= 255;
	    var max = Math.max(r, g, b), min = Math.min(r, g, b);
	    var h, s, l = (max + min) / 2;
	    console.log(r,g,b,max,min)
	    if (max == min){ 
	        h = s = 0; // achromatic
	    } else {
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	        switch(max) {
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }
	        h /= 6;
	    }
	    h = Math.round(h * 360);
	    return { h, s, l };
	}
	
	//see:https://cloud.tencent.com/developer/ask/50767
	/**
	 * RGB 颜色值转换为 HSV(色相，饱和度，明度(value))
	 * h(0~360)
	 * s(0-1)
	 * v(0-1)
	 */
	static RGB2HSV2( {r, g, b} = rgb )  {
	    var rr, gg, bb,
	        r = r / 255,
	        g = g / 255,
	        b = b / 255,
	        h, s,
	        v = Math.max(r, g, b),
	        diff = v - Math.min(r, g, b),
	        diffc = function(c){
	            return (v - c) / 6 / diff + 1 / 2;
	        };

	    if (diff == 0) {
	        h = s = 0;
	    } else {
	        s = diff / v;
	        rr = diffc(r);
	        gg = diffc(g);
	        bb = diffc(b);

	        if (r === v) {
	            h = bb - gg;
	        }else if (g === v) {
	            h = (1 / 3) + rr - bb;
	        }else if (b === v) {
	            h = (2 / 3) + gg - rr;
	        }
	        if (h < 0) {
	            h += 1;
	        }else if (h > 1) {
	            h -= 1;
	        }
	    }
	    return {
	        h: Math.round(h * 360),
	        s: s,
	        v: v
	    };
	}

	/* 
	//see http://www.imooc.com/wenda/detail/593263
	accepts parameters

	 * h  Object = {h:x, s:y, v:z}

	 * OR 

	 * h, s, v

	*/

	static HSV2RGB( { h, s, v } = hsv ) {
	    var r, g, b, i, f, p, q, t;
	    i = Math.floor(h * 6);
	    f = h * 6 - i;
	    p = v * (1 - s);
	    q = v * (1 - f * s);
	    t = v * (1 - (1 - f) * s);
	    switch (i % 6) {
	        case 0: r = v, g = t, b = p; break;
	        case 1: r = q, g = v, b = p; break;
	        case 2: r = p, g = v, b = t; break;
	        case 3: r = p, g = q, b = v; break;
	        case 4: r = t, g = p, b = v; break;
	        case 5: r = v, g = p, b = q; break;
	    }
	    return {
	        r: Math.round(r * 255),
	        g: Math.round(g * 255),
	        b: Math.round(b * 255)
	    };

	}
	/* accepts parameters
	 * r  Object = {r:x, g:y, b:z}

	 * OR 

	 * r, g, b

	*/

	static RGB2HSV({r, g, b}= rgb ) {
	    var max = Math.max(r, g, b), min = Math.min(r, g, b),
	    	d = max - min,h,
	    	s = (max === 0 ? 0 : d / max),
	    	v = max / 255;
	    switch (max) {
	    	case min: h = 0; break;
	    	case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
	    	case g: h = (b - r) + d * 2; h /= 6 * d; break;
	    	case b: h = (r - g) + d * 4; h /= 6 * d; break;
	    }

	    return {h, s, v};
	}

	static HSV2HSL( {h, s, v}= hsv ) {
	    var _h = h,
	    	_s = s * v,
	    	_l = (2 - s) * v;
	    _s /= (_l <= 1) ? _l : 2 - _l;
	    _l /= 2;
	    return { h: _h, s: _s, l: _l };
	}



	static HSL2HSV( {h, s, l }= hsl ) {		
	    var _h = h,_s,_v;
	    l *= 2;
	    s *= (l <= 1) ? l : 2 - l;
	    _v = (l + s) / 2;
	    _s = (2 * s) / (l + s);
	    return {
	    	h: _h, s: _s, v: _v
	    };
	}
	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes s, and l are contained in the set [0, 1] and, h between 0 to 360
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   {number}  h       The hue (0~360)
	 * @param   {number}  s       The saturation
	 * @param   {number}  l       The lightness
	 * @return  {Array}           The RGB representation
	 */
	static HSL2RGB( {h, s, l }= hsl ){
		h = h/360;
	    var r, g, b;
	    if(s == 0){
	        r = g = b = l; // achromatic
	    }else{
	        var hue2rgb = function hue2rgb(p, q, t){
	            if(t < 0) t += 1;
	            if(t > 1) t -= 1;
	            if(t < 1/6) return p + (q - p) * 6 * t;
	            if(t < 1/2) return q;
	            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	            return p;
	        }

	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1/3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1/3);
	    }
	    return {
	    	r:Math.round(r * 255), 
	    	g:Math.round(g * 255), 
	    	b:Math.round(b * 255)
	    }
	}
	/**
	 * C：Cyan = 青色，又称为‘天蓝色’或是‘湛蓝’M：Magenta = 品红色，又称为‘洋红色’；Y：Yellow = 黄色；K：blacK=黑色\
	 * c,m,y,k 取值 (0~1)
	 */
	static CMYK2RGB( {c, m, y, k} = cmyk ){
		var r = Math.round( 255 * (1 - c) * (1 - k));
		var g = Math.round( 255 * (1 - m) * (1 - k));
		var b = Math.round( 255 * (1 - y) * (1 - k));
	}

	static RGB2CMYK( {r, g, b} = rgb ){
		var c = (255 - r) / 255;
        var m = (255 - g) / 255;
        var y = (255 - b) / 255;
        var k = Math.min(c, Math.min(m, y));
        if (k == 1){
            c = m = y = 0;
        }else{
            c = (c - k) / (1 - k);
            m = (m - k) / (1 - k);
            y = (y - k) / (1 - k);
        }
        return {c,m,y,k}
	}
	/**  
	 * rgb颜色转16进制表示
	 */
	static RGB2HEX ( {r, g, b} = rgb )  {
		return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6,"0");
	}

	set color( obj ){
		if( typeof obj =='string'){
			var strHex = "";
			var numAlpha = 1;
			if (/^(rgba?|RGBA?)/.test( obj )) {
				var aColor = obj.replace(/(?:\(|\)|rgba?|RGBA?)*/g, "").split(",");
				var len = Math.min( aColor.length, 3);
		        strHex = "#";
		        for (var i=0; i<len; i++) {
		            var hex = Number(aColor[i]).toString(16);
		            if (hex.length < 2) {
		                hex = '0' + hex;    
		            }
		            strHex += hex;
		        }
		        if (strHex.length !== 7) {
		            strHex = obj;    
		        }
		        if( len == 4){
		        	numAlpha = Number( aColor[3]);
		        }
		        
			}else if (/^(hsl|HSL)/.test( obj )) {
				var aHSL = obj.replace(/(?:\(|\)|hsl|HSL)*/g, "").split(",");
				if( aHSL.length === 3 ){
					var h = parseInt(aHSL[0]);
					var s = /%/.test(aHSL[1])? parseFloat( aHSL[1] )/100: parseFloat( aHSL[1] );
					var l = /%/.test(aHSL[2])? parseFloat( aHSL[2] )/100: parseFloat( aHSL[2] );
					var rgb = Color.HSL2RGB({h,s,l});
					strHex = Color.RGB2HEX( rgb );
				}else{
					throw new Error("*** hsl 颜色值不正确 ***");
				}
			}else if( Color.REGEXP_RGB.test( obj )){
				var aNum = obj.replace(/#/,"").split("");
				if( aNum.length === 8 ){
					strHex = '#' + aNum.slice(0,6).join('');
					numAlpha = (Number('0x'+aNum.slice(6,8).join(''))/255).toFixed(2);
				}
		        if (aNum.length === 6) {
		            strHex = '#' + aNum.join('');
		        } else if(aNum.length === 3) {
		            var numHex = "#";
		            for (var i=0; i<aNum.length; i+=1) {
		                numHex += (aNum[i] + aNum[i]);
		            }
		            strHex = numHex;
		        }
			}
			this._hexstring = strHex;
			this._alpha = numAlpha;
		}else{
			if( typeof obj.alpha !='undefined'){
				this._alpha = obj.alpha;
			}else{
				this._alpha = 1;
			}
			if( typeof obj.r!='undefined'){
				//rgb color				
				this._hexstring = Color.RGB2HEX( obj );
			}else if( typeof obj.h !='undefined'){
				//hsl color
				this._hexstring = Color.RGB2HEX( Color.HSL2RGB( obj ));
			}
		}
	}

	/** 
	 * 返回16进制颜色表示，如：#FF0000
	 * @prop {string} hexString 
	 */
	get hexString(){
		return this._hexstring;
	}

	/** 
	 * 返回hsl 颜色表示，如：hsl(100,100%,50%)
	 * @prop {string} hlstring 
	 */
	get hslstring(){
		let hsl = Color.RGB2HSL( this.rgba );
		let s = Math.floor(hsl.s*100)+'%';
		let l = Math.floor(hsl.l*100)+'%';
		return `hsl(${hsl.h},${s},${l})`;
	}

	/** 
	 * 返回rgba 颜色表示，如：rgba(255,0,0,1)
	 * @prop {string} hlstring 
	 */
	get rgbstring(){
		let {r,g,b,alpha} = this.rgba;
		return `rgba(${r},${g},${b},${alpha})`;
	}

	/* 获取rgb分量 **/
	get rgba(){
		var n = Number(this._hexstring.replace(/#/,"0x"));
		var r = ( n >> 16) & 0xFF;
		var g = ( n >> 8) & 0xFF;
		var b = n & 0xFF;
		var alpha = this.alpha;
		return {r,g,b,alpha}
	}
	get alpha(){
		return this._alpha;
	}

	toString(){
		return this.hexString;
	}
}

export default Color;
export {Color}