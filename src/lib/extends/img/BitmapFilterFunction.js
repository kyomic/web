let BitmapFilterFunction = {

}

/**
 * 冰冻滤镜(不懂)
 *  公式： r = (r-g-b)*3/2; g = (g-r-b)*3/2; b = (b-g-r)*3/2;
 */
BitmapFilterFunction.BitmapICE = ( r, g, b ) =>{
	r = (r-g-b)*3/2;
	g = (g-r-b)*3/2;
	b = (b-g-r)*3/2;
	r =  r < 0 ? 0 : r > 255 ? 255 : r;
	g =  g < 0 ? 0 : g > 255 ? 255 : g;
	b =  b < 0 ? 0 : b > 255 ? 255 : b;
	return { r, g, b }
}

/*
 1 最大值法：即新的颜色值R＝G＝B＝Max(R，G，B)，这种方法处理后的图片看起来亮度值偏高。
 2 平均值法：即新的颜色值R＝G＝B＝(R＋G＋B)／3，这样处理的图片十分柔和
 3 加权平均值法：即新的颜色值R＝G＝B＝(R ＊ Wr＋G＊Wg＋B＊Wb)，一般由于人眼对不同颜色的敏感度不一样，所以三种颜色值的权重不一样，一般来说绿色最高，红色其次，蓝色最低，最合理的取值分别为Wr ＝ 30％，Wg ＝ 59％，Wb ＝ 11％
*/

BitmapFilterFunction.gray =( r, g, b ) => {
	let gray =  Math.floor(r * 0.3 + g *0.59 + b * 0.11);
	return { r:gray, g:gray, b:gray };
}

/** 二值化 */
BitmapFilterFunction.binarization = ( r, g, b )=>{
	var index = 255 / 2; //阈值
	var sum = (r + g + b) / 3;
	let c = sum > index ? 255 : 0;
	return { r:c, g:c, b:c };
}
/** 图片反转，底片 **/
BitmapFilterFunction.revert = ( r, g, b ) =>{
	return { r: 255-r, g: 255-g, b: 255- b };
}


/** 
 * 连环画滤镜
 * 公式： R = |g – b + g + r| * r / 256
 * G = |b – g + b + r| * r / 256;
 * B = |b – g + b + r| * g / 256;
 */

BitmapFilterFunction.Paint = ( r, g, b ) =>{

}

/* 
熔铸滤镜
公式： r = r*128/(g+b +1); g = g*128/(r+b +1); b = b*128/(g+r +1);
*/

/* 去色 */
/* r = r * 0.393 + g * 0.769 + b * 0.189; g = r * 0.349 + g * 0.686 + b * 0.168; b = r * 0.272 + g * 0.534 + b * 0.131;
*/

export default BitmapFilterFunction;