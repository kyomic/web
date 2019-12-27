class ColorFilter{
	/**
	 * @param {Color} color - 颜色值
	 * @param {number} [level=3] - (0<255] 默认是3
	 */
	static GRAY( {r,g,b}= color, level = 3){
		let c = Math.floor((r + g + b ) / level );
		return {c,c,c};
	}
}


export default ColorFilter;