class ColorFilter{
	/**
	 * @param {Color} color - 颜色值
	 * @param {number} [level=3] - (0<255] 默认是3
	 */
	static GRAY( {r,g,b}= color, level = 3){
		let c = Math.floor((r + g + b ) / level );
		return {c,c,c};
	}

	/** 图像亮度 brightness**/
	static BRIGHTNESS( { r, g, b}= color, number = 0 ){
		r =  Math.min(255, Math.max( r + number , 0));
		g =  Math.min(255, Math.max( g + number , 0));
		b =  Math.min(255, Math.max( b + number , 0));
		return {r,g,b}
	}
	/** 图像饱和度 **/
	static CONSTRAST( { r, g, b}= color, percent = 0 ){
		r =  Math.min(255, Math.max( r* percent + r , 0));
		g =  Math.min(255, Math.max( g* percent + g , 0));
		b =  Math.min(255, Math.max( b* percent + b , 0));
		return {r,g,b}
	}
	//threshold
	static THRESHOLD( { r, g, b } = color, threshold ){
		var v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
		return {r:v,g:v,b:v};
	}
	//see:http://beesbuzz.biz/code/16-hsv-color-transforms
	//https://stackoverflow.com/questions/40600127/html5-canvas-hue-rotate-changing-saturation-and-lightness
	static HUE( {r, g, b}=color, angle ){
		var angle = (angle || 0) / 180 * Math.PI;
		var cosA = Math.cos(angle),
		    sinA = Math.sin(angle),
		    sqrt = Math.sqrt;
		var w = 1 / 3,
			sqrW = sqrt(w);

		let matrix = [[1,0,0],[0,1,0],[0,0,1]];
		matrix[0][0] = cosA + (1.0 - cosA) * w
        matrix[0][1] = w * (1.0 - cosA) - sqrW * sinA
        matrix[0][2] = w * (1.0 - cosA) + sqrW * sinA
        matrix[1][0] = w * (1.0 - cosA) + sqrW * sinA
        matrix[1][1] = cosA + w *(1.0 - cosA)
        matrix[1][2] = w * (1.0 - cosA) - sqrW * sinA
        matrix[2][0] = w * (1.0 - cosA) - sqrW * sinA
        matrix[2][1] = w * (1.0 - cosA) + sqrW * sinA
        matrix[2][2] = cosA + w * (1.0 - cosA)

        let r0 = r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]
        let g0 = r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]
        let b0 = r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]
        return {r:r0,g:g0,b:b0}
	}
}


export default ColorFilter;

export {
	ColorFilter
}