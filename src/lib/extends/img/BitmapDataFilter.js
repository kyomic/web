import BitmapFilterFunction from './BitmapFilterFunction';
let BitmapDataFilter = {

}

/*
 var canvasData = tempContext.getImageData(0, 0, canvas.width, canvas.height); 
 var binaryData = canvasData.data;
 */

/**
 * 灰度图像
 * @param {array} - bitmapData canvas图像数据
 */
BitmapDataFilter.gray = ( bitmapData, {level} = {level:3} ) =>{
	var d = bitmapData.data, avg;
	level = level || 0.5;
	var step = level * 255 / ( 128/ 3 );
	for (var i = 0; i<d.length; i+=4) {
		avg = Math.floor((d[i] + d[i+1] + d[i+2]) / step );
		d[i] = avg;
		d[i+1] = avg;
		d[i+2] = avg; 
	}
	return bitmapData;
}
BitmapDataFilter.gray.toString = ()=>{
	return [
		'BitmapDataFilter.gray = ( bitmapData, {level} = {level:3} ) =>{',
		'	var d = bitmapData.data, avg;',
		'	level = level || 0.5;',
		'	var step = level * 255 / ( 128/ 3 );',
		'	for (var i = 0; i<d.length; i+=4) {',
		'		avg = Math.floor((d[i] + d[i+1] + d[i+2]) / step );',
		'		d[i] = avg;',
		'		d[i+1] = avg;',
		'		d[i+2] = avg; ',
		'	}',
		'	return bitmapData;',
		'}'
	].join('\r\n');
}


//去色滤镜 原理：将当前像素的RGB值得最大值和最小值求平均值并作为新的RGB值。
BitmapDataFilter.clear3  = ( bitmapData ) => {
	var d = bitmapData.data;
	for (var i = 0; i<d.length; i+=4) {
		var c = (Math.max(d[i]+d[i+1]+d[i+2])+Math.min(d[i]+d[i+1]+d[i+2]) / 2) - 200;
		d[i] = c
		d[i+1] = c;
		d[i+2] = c; 
	}
}
//rgb三种颜色取三种颜色的最值的平均值。
BitmapDataFilter.clear  = ( bitmapData ) =>{
	var d = bitmapData.data;
	for(var i = 0; i < d.length; i++) {
		var avg = Math.floor((Math.min(d[i], d[i+1], d[i+2]) + Math.max(d[i], d[i+1], d[i+2])) / 2 );
		d[i] = d[i+1] = d[i+2] = avg;
	}
	return bitmapData;
}

BitmapDataFilter.revert = ( bitmapData ) => {
	var d = bitmapData.data; 
	for (var i = 0, len=d.length; i<len; i+=4) {
		d[i] = 255 - d[i];
		d[i+1] = 255 - d[i+1]
		d[i+2] = 255 - d[i+2]; 
	}
	return bitmapData;
}


	// 4.滤波
	/*函数第一个参数是 canvas上的 imageData 对象 
	第二个参数是传入矩阵所对应的数组，如果是下面这样的矩阵 
		a b c 
 		d e f 
 		g h i 
		则传入第二个的参数应为 [a,b,c,d,e,f,g,h,i] 
	*/
BitmapDataFilter.matrix = (bitmapData, array) => {
    var w = imageData.width, h = imageData.height;
    var data1 = new Array();
    var data2 = new Array();
	var data1 = imageData.data;
	var data2 = imageData.data;
	var a = array;
    for (var i=0; i<h; i++) {  // 行
        for (var j=0; j<w; j++) {  // 列
            for (var k=0; k<3; k++) {
                var num = (i*w + j)*4 + k;
                var numUp = ((i-1)*w+j)*4 + k;
                var numDown = ((i+1)*w+j)*4 + k;
                data1[num] = -(a[0]*data2[numUp-4] + a[1]*data2[numUp] + a[2]*data2[numUp+4]
                    + a[3]*data2[num-4] + a[4]*data2[num] + a[5]*data2[num+4]
                    + a[6]*data2[numDown-4] + a[7]*data2[numDown] + a[8]*data2[numDown+4]);
        	}
		}
	}
}
// 5.复古(褐色)
BitmapDataFilter.sepia = (bitmapData)=> { 
	var d = bitmapData.data; 
	for (var i = 0; i < d.length; i += 4) { 
		var r = d[i]; 
		var g = d[i + 1]; 
		var b = d[i + 2]; 
		d[i] = (r * 0.393)+(g * 0.769)+(b * 0.189); 		
	}
	return bitmapData;
}
// 5.复古2
BitmapDataFilter.sepia2 = (bitmapData)=> {
	var d = bitmapData.data;
	var w = bitmapData.width,
		h = bitmapData.height;

	for (var i = 0; i < d.length; i += 4) {
	    var r = d[i]; 
		var g = d[i + 1]; 
		var b = d[i + 2];

	    var newR = (0.393 * r + 0.769 * g + 0.189 * b);
	    var newG = (0.349 * r + 0.686 * g + 0.168 * b);
	    var newB = (0.272 * r + 0.534 * g + 0.131 * b);
	    var rgbArr = [newR, newG, newB].map((e) => {
	        return e < 0 ? 0 : e > 255 ? 255 : e;
	    });
	    d[i] =  d[i+1] = d[i+2] = rgbArr;
	}
}


BitmapDataFilter.ice = ( bitmapData )=>{
	let d = bitmapData.data;
	for (var i = 0; i < d.length; i += 4) {
		let {r, g, b} = BitmapFilterFunction.binarization( d[i], d[i+1], d[i+2]);
		d[i]=r;
		d[i+1]=g;
		d[i+2]=b;
	}
	return bitmapData;
}
// 6.红色蒙版
// 红色通道取平均值,绿色通道和蓝色通道都设为0

BitmapDataFilter.maskRed = (bitmapData) => { 
	var d = bitmapData.data; 
	for (var i = 0; i < d.length; i += 4) { 
		var r = d[i]; 
		var g = d[i + 1]; 
		var b = d[i + 2]; 
		d[i] = (r+g+b)/3; 
		d[i+1] = 0;
		d[i+2] = 0;
	}
}
	// 7.增加亮度
BitmapDataFilter.brightness = (bitmapData,delta) => { 
	var d = bitmapData.data; 
	for (var i = 0; i < d.length; i += 4) { 
		d[i] += delta; 
		d[i + 1] += delta; 
		d[i + 2] += delta; 
	} 
}
 
// 8.浮雕
BitmapDataFilter.carve = (imageData) => {
    var w = imageData.width, h = imageData.height;
	var d = imageData.data;
    for (var i=h; i>0; i--) {  // 行
        for (var j=w; j>0; j--) {  // 列
            for (var k=0; k<3; k++) {
                var num = (i*w + j)*4 + k;
                var numUp = ((i-1)*w+j)*4 + k;
                var numDown = ((i+1)*w+j)*4 + k;
				d[num] = d[num]-d[numUp-4]+128;         
        	}
	    }
	}
	return imageData;
}


// 9.雾化
/*function fog(imageData){
    var w = imageData.width, var data = imageData.data;
    for (var i=h; i>0; i--) {  // 行
        for (var j=w; j>0; j--) {  // 列
        	var num = (i*w + j)*4;
        	if (Math.random()<0.5) {
        		data[num] = 255;
        		data[num+1] = 255;
        		data[num+2] = 255;
        	}
	    }
	}
}*/
 
// 10.毛玻璃效果
// 原理：用当前点四周一定范围内任意一点的颜色来替代当前点颜色，最常用的是随机的采用相邻点进行替代。
BitmapDataFilter.spread = (bitmapData) => {  
    var w = bitmapData.width, h = bitmapData.height;
    var d = bitmapData.data;
 	for ( var i = 0; i < h; i++) {  
     	for ( var j = 0; j < w; j++) {  
			for (var k = 0; k<3; k++) {
				// Index of the pixel in the array  
	        	var num = (i*w + j) * 4 + k;  
	  
	           	var rand = Math.floor(Math.random()*10)%3;
	           	var num2 = ((i+rand)*w + (j+rand)) * 4 + k;  
	           	
	           	d[num] = d[num2]
	           	//canvasData.data[idx + 3] = 255; // Alpha channel    
	           	// add black border  
	           	//if(x < 4 || y < 4 || x > (canvasData.width - 4) || y > (canvasData.height - 4)) {  
	            //	canvasData.data[num] = 0;  
	           	//}  
			}
        }  
	}  
	return bitmapData;
}
// 11.马赛克
// 将图像分成大小一致的图像块，每一个图像块都是一个正方形，
// 并且在这个正方形中所有像素值都相等。我们可以将这个正方形看作是一个模板窗口，
// 模板中对应的所有图像像素值都等于该模板的左上角第一个像素的像素值，
// 这样的效果就是马赛克效果，而正方形模板的大小则决定了马赛克块的大小，即图像马赛克化的程度。

/**
 * @param {number} size - 0-100
 */
BitmapDataFilter.mosaic = (bitmapData,  option = {size:3} ) => {
	let { size = 3 } = option || { size: 3 }; 
	size = Math.round( size );
	if( size <= 0) return bitmapData;
	var w = bitmapData.width, h = bitmapData.height;
	var d = bitmapData.data;    
    for(var i=1; i<h-1; i+=size){
        for(var j=1; j<w-1; j+=size){
            var num = (i*w + j) * 4;
            for (var dx=0; dx<size; dx++) {
                for (var dy=0; dy<size; dy++) {
                    var x = i + dx;
                    var y = j + dy;
                    var p1 = (x*w + y)*4;                    
                    d[p1+0] = d[num+0];
                    d[p1+1] = d[num+1];
                    d[p1+2] = d[num+2];
                }
            }
        }
    }
    return bitmapData;
}

/**
 * 高斯模糊的原理就是根据正态分布使得每个像素点周围的像素点的权重不一致，将各个权重（各个权重值和为1）与对应的色值相乘，所得结果求和为中心像素点新的色值。我们需要了解的高斯模糊的公式
 * 
 * @param {number} radius - 模糊半径(0.1~250)
 * @param {number} sigma -
 */
BitmapDataFilter.gaussBlur =( bitmapData, {radius} = option ) => {
	var pixes = bitmapData.data;
	var width = bitmapData.width;
	var height = bitmapData.height;
	var gaussMatrix = [],
		gaussSum = 0,
		x, y,
		r, g, b, a,
		i, j, k, len;

	var radius = Math.floor(radius) || 10;
	var sigma = sigma || radius/3;
	a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
	b = -1 / (2 * sigma * sigma);
	//生成高斯矩阵
	for (i = 0, x = -radius; x <= radius; x++, i++) {
		g = a * Math.exp(b * x * x);
		gaussMatrix[i] = g;
		gaussSum += g;
	}

	//归一化, 保证高斯矩阵的值在[0,1]之间
	for (i = 0, len = gaussMatrix.length; i < len; i++) {
		gaussMatrix[i] /= gaussSum;
	}
	//x 方向一维高斯运算
	for (y = 0; y < height; y++) {
		for (x = 0; x < width; x++) {
			r = g = b = a = 0;
			gaussSum = 0;
			for (j = -radius; j <= radius; j++) {
				k = x + j;
				if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
					//r,g,b,a 四个一组
					i = (y * width + k) * 4;
					r += pixes[i] * gaussMatrix[j + radius];
					g += pixes[i + 1] * gaussMatrix[j + radius];
					b += pixes[i + 2] * gaussMatrix[j + radius];
					// a += pixes[i + 3] * gaussMatrix[j];
					gaussSum += gaussMatrix[j + radius];
				}
			}
			i = (y * width + x) * 4;
			// 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
			// console.log(gaussSum)
			pixes[i] = r / gaussSum;
			pixes[i + 1] = g / gaussSum;
			pixes[i + 2] = b / gaussSum;
			// pixes[i + 3] = a ;
		}
	}
	//y 方向一维高斯运算
	for (x = 0; x < width; x++) {
		for (y = 0; y < height; y++) {
			r = g = b = a = 0;
			gaussSum = 0;
			for (j = -radius; j <= radius; j++) {
				k = y + j;
				if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
					i = (k * width + x) * 4;
					r += pixes[i] * gaussMatrix[j + radius];
					g += pixes[i + 1] * gaussMatrix[j + radius];
					b += pixes[i + 2] * gaussMatrix[j + radius];
					// a += pixes[i + 3] * gaussMatrix[j];
					gaussSum += gaussMatrix[j + radius];
				}
			}
			i = (y * width + x) * 4;
			pixes[i] = r / gaussSum;
			pixes[i + 1] = g / gaussSum;
			pixes[i + 2] = b / gaussSum;
		}
	}
	return bitmapData;
}
/*
BitmapDataFilter.gauss2Blur =( bitmapData, {radius, sigma} = option ) => {
	var pixes = bitmapData.data,
        height = bitmapData.height,
        width = bitmapData.width,
        radius = Math.floor(radius || 5);
        sigma = Math.floor( sigma || radius / 3);    
    var gaussEdge = radius * 2 + 1;
    var handleEdge = (i, x, w )=>{
	    var m = x + i;
	    if(m < 0) {
	        m = -m;
	    } else if(m >= w) {
	        m = w + i -x;
	    }
	    return m;
	}
    
    var gaussMatrix = [],
        gaussSum = 0,
        a = 1 / (2 * sigma * sigma * Math.PI),
        b = -a * Math.PI;
    
    for(var i = -radius; i <= radius; i++) {
        for(var j = -radius; j <= radius; j++) {
            var gxy = a * Math.exp((i * i + j * j) * b);
            gaussMatrix.push(gxy);
            gaussSum += gxy;
        }
    }
    var gaussNum = (radius + 1) * (radius + 1);
    for(var i = 0; i < gaussNum; i++) {
        gaussMatrix[i] /= gaussSum;
    }

    for(var x = 0; x < width; x++) {
        for(var y = 0; y < height; y++) {
            var r = 0,g = 0, b = 0;
            for(var i = -radius; i<=radius; i++) {
                var m = handleEdge(i, x, width);
                for(var j = -radius; j <= radius; j++) {
                    var mm = handleEdge(j, y, height);
                    var currentPixId = (mm * width + m) * 4;
                    var jj = j + radius;
                    var ii = i + radius;
                    r += pixes[currentPixId] * gaussMatrix[jj * gaussEdge + ii];
                    g += pixes[currentPixId + 1] * gaussMatrix[jj * gaussEdge + ii];
                    b += pixes[currentPixId + 2] * gaussMatrix[jj * gaussEdge + ii];
                }
            }
            var pixId = (y * width + x) * 4;

            pixes[pixId] = ~~r;
            pixes[pixId + 1] = ~~g;
            pixes[pixId + 2] = ~~b;
        }
    }
    return bitmapData;
}

*/

/** 
* convolution - keneral size 5*5 - blur effect filter(模糊效果) 
* 
* @param context 
* @param canvasData 
*/ 
//https://www.jb51.net/article/39210.htm
BitmapDataFilter.blur = ( bitmapData ) =>  { 
	console.log("Canvas Filter - blur process"); 
	var d = bitmapData.data,
		w = bitmapData.width,
		h = bitmapData.height;

	var sumred = 0.0, sumgreen = 0.0, sumblue = 0.0; 
	for ( var x = 0; x < w; x++) { 
		for ( var y = 0; y < h; y++) { 
			// Index of the pixel in the array 
			var idx = (x + y * w) * 4; 
			for(var subCol=-2; subCol<=2; subCol++) { 
				var colOff = subCol + x; 
				if(colOff <0 || colOff >= w) { 
					colOff = 0; 
				} 
				for(var subRow=-2; subRow<=2; subRow++) { 
					var rowOff = subRow + y; 
					if(rowOff < 0 || rowOff >= h) { 
						rowOff = 0; 
					} 
					var idx2 = (colOff + rowOff * w) * 4; 
					var r = d[idx2 + 0]; 
					var g = d[idx2 + 1]; 
					var b = d[idx2 + 2]; 
					sumred += r; 
					sumgreen += g; 
					sumblue += b; 
				} 
			} 
			// calculate new RGB value 
			var nr = (sumred / 25.0); 
			var ng = (sumgreen / 25.0); 
			var nb = (sumblue / 25.0); 
			// clear previous for next pixel point 
			sumred = 0.0; 
			sumgreen = 0.0; 
			sumblue = 0.0; 
			// assign new pixel value 
			d[idx + 0] = nr; // Red channel 
			d[idx + 1] = ng; // Green channel 
			d[idx + 2] = nb; // Blue channel 
			d[idx + 3] = 255; // Alpha channel 
		} 
	} 
	return bitmapData;
}

/** 
* after pixel value - before pixel value + 128 
* 浮雕效果 
*/ 
BitmapDataFilter.reliefProcess = ( bitmapData)=> { 
	console.log("Canvas Filter - relief process"); 
	var d = bitmapData.data,
		w = bitmapData.width,
		h = bitmapData.height;

	for ( var x = 1; x < w-1; x++) { 
		for ( var y = 1; y < h-1; y++) 
		{ 
			// Index of the pixel in the array 
			var idx = (x + y * w) * 4; 
			var bidx = ((x-1) + y * w) * 4; 
			var aidx = ((x+1) + y * w) * 4; 
			// calculate new RGB value 
			var nr = d[aidx + 0] - d[bidx + 0] + 128; 
			var ng = d[aidx + 1] - d[bidx + 1] + 128; 
			var nb = d[aidx + 2] - d[bidx + 2] + 128; 
			nr = (nr < 0) ? 0 : ((nr >255) ? 255 : nr); 
			ng = (ng < 0) ? 0 : ((ng >255) ? 255 : ng); 
			nb = (nb < 0) ? 0 : ((nb >255) ? 255 : nb); 
			// assign new pixel value 
			d[idx + 0] = nr; // Red channel 
			d[idx + 1] = ng; // Green channel 
			d[idx + 2] = nb; // Blue channel 
			d[idx + 3] = 255; // Alpha channel 
		} 
	}
	return bitmapData;
}, 

/** 
* before pixel value - after pixel value + 128 
* 雕刻效果 
* 
* @param canvasData 
*/ 
BitmapDataFilter.diaokeProcess = (bitmapData) => { 
	console.log("Canvas Filter - process"); 
	var d = bitmapData.data,
		w = bitmapData.width,
		h = bitmapData.height;
	for ( var x = 1; x < w-1; x++) { 
		for ( var y = 1; y < h-1; y++) { 
			// Index of the pixel in the array 
			var idx = (x + y * w) * 4; 
			var bidx = ((x-1) + y * w) * 4; 
			var aidx = ((x+1) + y * w) * 4; 
			// calculate new RGB value 
			var nr = d[bidx + 0] - d[aidx + 0] + 128; 
			var ng = d[bidx + 1] - d[aidx + 1] + 128; 
			var nb = d[bidx + 2] - d[aidx + 2] + 128; 
			nr = (nr < 0) ? 0 : ((nr >255) ? 255 : nr); 
			ng = (ng < 0) ? 0 : ((ng >255) ? 255 : ng); 
			nb = (nb < 0) ? 0 : ((nb >255) ? 255 : nb); 
			// assign new pixel value 
			d[idx + 0] = nr; // Red channel 
			d[idx + 1] = ng; // Green channel 
			d[idx + 2] = nb; // Blue channel 
			d[idx + 3] = 255; // Alpha channel 
		} 
	}
	return bitmapData;
}, 

/** 
* mirror reflect 
* 
* @param context 
* @param canvasData 
*/ 
BitmapDataFilter.mirrorProcess = ( bitmapData ) => { 
	console.log("Canvas Filter - process"); 
	var d = bitmapData.data,
		w = bitmapData.width,
		h = bitmapData.height;
	for ( var x = 0; x < w; x++) // column 
	{ 
		for ( var y = 0; y < h; y++) // row 
		{ 
			// Index of the pixel in the array 
			var idx = (x + y * w) * 4; 
			var midx = (((w -1) - x) + y * w) * 4; 
			// assign new pixel value 
			d[midx + 0] = d[idx + 0]; // Red channel 
			d[midx + 1] = d[idx + 1]; ; // Green channel 
			d[midx + 2] = d[idx + 2]; ; // Blue channel 
			d[midx + 3] = 255; // Alpha channel 
		}
	} 
	return bitmapData;
}
 
// 13.二值化
BitmapDataFilter.noor = (bitmapData)=>{
	var d = bitmapData.data;
	for (var i = 0; i<d.length; i+=4) {
		for (var j = 0; j < 3; j++) {
			if (d[i+j]<127) {
				d[i+j] = 0;
			} else {
				d[i+j] = 255;
			}
		}
	}
	return bitmapData;
}
export default BitmapDataFilter;