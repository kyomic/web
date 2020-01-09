import Color from './Color';
/**
 * 图层模式算法(wangxk整理)
 * 参考：http://www.16xx8.com/photoshop/jiaocheng/2016/142761.html
 * https://www.cnblogs.com/lanye/p/3425271.html
 https://blog.csdn.net/zylxadz/article/details/47803479
 https://blog.csdn.net/chy555chy/article/details/54016317
 * @author wangxk

 //　以下
 //  A是基色，B是混合色。C是结果色

 */

class ColorBlender{
	static FIX( {r, g, b} = rgb ){
		r = Math.round( Math.abs(r) );
		g = Math.round( Math.abs(g) );
		b = Math.round( Math.abs(b) );
		r = r>255 ? 255:r;
		g = g>255 ? 255:g;
		b = b>255 ? 255:b;
		return {r,g,b}
	}
	//--------------------《1》基础型 ---------------------
	//普通模式
	//C[i]=B[i];
	static NORMAL( color , {r, g, b} = rgb ){
		return {r,g,b};
	}
	//溶解（Dissolve）
	//将混合色图层的图像以散乱的点状形式叠加到基色图层的图像上，对图像的色彩不产生影响，与图像的不透明度有关。在图像的填充和不透明度都是100%时，边缘的效果是最明显的。
	static DISSOLVE( color, {r, g, b} = rgb ){

	}

	//---------------《2》降暗型 -----------------
	//变暗（Darken）
	//在该模式下，对混合的两个图层相对应区域RGB通道中的颜色亮度值进行比较，在混合图层中，比基色图层暗的像素保留，亮的像素用基色图层中暗的像素替换。总的颜色灰度级降低，造成变暗的效果
	//C[i]=Min（A[i],B[i]）;
	static DARKEN( color, {r, g, b} = rgb ){
		r = color.r > r ? r : color.r;
		g = color.g > g ? g : color.g;
		b = color.b > b ? b : color.b;
		return {r,g,b}
	}
	//正片叠底
	//将上下两层图层像素颜色的灰度级进行乘法计算，获得灰度级更低的颜色而成为合成后的颜色，图层合成后的效果简单地说是低灰阶的像素显现而高灰阶不显现（即深色出现，浅色不出现，黑色灰度级为0，白色灰度级为255）。
	static MUTIPLY( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = Math.round( r0 * r / 255 );
		g = Math.round( g0 * g / 255 );
		b = Math.round( b0 * b / 255 );
		return {r,g,b}
	}
	//颜色加深（Color Burn）
	//使用这种模式时，会加暗图层的颜色值，加上的颜色越亮，效果越细腻。让底层的颜色变暗，有点类似于正片叠底，但不同的是，它会根据叠加的像素颜色相应增加对比度。和白色混合没有效果。
　　//计算公式：结果色 = （基色 + 混合色 - 255） * 255 / 混合色，其中如果（基色+混合色-255）出现负数则直接归零。
	//C[i]={B[i]== 0 ? B[i] : Max(0, Max(0, (255 - ((255 - A[i]) << 8 ) / B[i])))}；  
	static COLOR_BURN( color, {r, g, b} = rgb ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		/*
		r = r0 == 0 ? r0 : Math.max( 0, Math.max(0, 255 - ((255 - r ) << 8 )/ r0 ));
		g = g0 == 0 ? g0 : Math.max( 0, Math.max(0, 255 - ((255 - g ) << 8 )/ g0 ));
		b = b0 == 0 ? b0 : Math.max( 0, Math.max(0, 255 - ((255 - b ) << 8 )/ b0 ));
		*/
		r = r == 0 ? 0 : Math.max( 0, Math.max(0, 255 - ((255 - r0 ) << 8 )/ r ));
		g = g == 0 ? 0 : Math.max( 0, Math.max(0, 255 - ((255 - g0 ) << 8 )/ g ));
		b = b == 0 ? 0 : Math.max( 0, Math.max(0, 255 - ((255 - b0 ) << 8 )/ b ));

		return {r,g,b}
	}
	//线性加深（Linear Burn）
	//和颜色加深模式一样，线性加深模式通过降低亮度，让底色变暗以反映混合色彩。和白色混合没有效果。
	//计算公式：结果色 = 基色 + 混合色 - 255，如果得出数值小于0，则直接归零。
	//C[i]={(A[i] + B[i] < 255) ? 0 : (A[i] + B[i] - 255)}；
	static LINEAR_BURN( color, {r, g, b} = rgb ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = r + r0 < 255 ? 0 : (r + r0 - 255);
		g = g + g0 < 255 ? 0 : (g + g0 - 255);
		b = b + b0 < 255 ? 0 : (b + b0 - 255);
		return {r,g,b}
	}
	//深色（Darker Color）
	//深色混合模式比较好理解。她是通过计算混合色与基色的所有通道的数值，然后选择数值较小的作为结果色。因此结果色只跟混合色或基色相同，不过产生出另外的颜色。白色与基色混合色得到基色，黑色与基色混合得到黑色。深色模式中，混合色与基色的数值是固定的，我们颠倒位置后，混合色出来的结果色是没有变化的。
	//当前图层与下方图层相比，颜色深（RGB总和较小）的显现出来，颜色浅的就被隐藏。
	static DARKER_COLOR( color, {r, g, b} = rgb ){
		let eq = color.r + color.g + color.b - r - g - b;
		return {
			r: eq <= 0?color.r:r,
			g: eq <= 0?color.g:g,
			b: eq <= 0?color.b:b
		}
	}
	//-----------------《3》提亮型----------------------
	//变亮（Lighten）
	//在该模式与变暗模式相反，是对混合的两个图层相对应区域RGB通道中的颜色亮度值进行比较，取较高的的像素点为混合之后的颜色，使得总的颜色灰度的亮度升高，造成变亮的效果。用黑色合成图像时无作用，用白色时则仍为白色。
	//C[i]={(B[i] > A[i]) ? B[i] : A[i]}；
	static LIGHTEN( color, {r, g, b} = rgb ){
		r = color.r > r ? color.r : r;
		g = color.g > g ? color.g : g;
		b = color.b > b ? color.b : b;
		return ColorBlender.FIX({r,g,b})
	}
	//滤色 
	//C[i]={255 - (((255 - A[i]) * (255 - B[i])) >> 8)}；
	static SCREEN( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = 255 - (((255 - r0) * (255 - r)) >> 8) //等价于 255 - Math.floor((255 - r) * (255 - r0) /255);
 		g = 255 - (((255 - g0) * (255 - g)) >> 8);
		b = 255 - (((255 - b0) * (255 - b)) >> 8);
		return {r,g,b};
	}
	//颜色减淡（Color Dodge）
	//使用这种模式时，会加亮图层的颜色值，加上的颜色越暗，效果越细腻。与颜色加深刚好相反，通过降低对比度，加亮底层颜色来反映混合色彩。与黑色混合没有任何效果。
　　//计算公式：结果色 =基色+ (混合色 * 基色) / (255 - 混合色)。混合色为黑色，结果色就等于基色，混合色为白色结果色就为白色。基色为黑色结果色就为黑色。
	//c={(B== 255) ?B : Min(255, ((A<< 8 ) / (255 - B)))}
	static COLOR_DODGE( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = r == 255 ? r : Math.min( 255, ( (r0 <<8 )/( 255 -r )));
		g = g == 255 ? g : Math.min( 255, ( (g0 <<8 )/( 255 -g )));
		b = b == 255 ? b : Math.min( 255, ( (b0 <<8 )/( 255 -b )));
		return {r,g,b}
	}
	//线性减淡（Linear Dodge）,ADD
	//类似于颜色减淡模式。但是通过增加亮度来使得底层颜色变亮，以此获得混合色彩。与黑色混合没有任何效果。
　　//计算公式：结果色 = 基色 + 混合色，其中基色与混合色的数值大于255，系统就默认为最大值也就是255。
	//C[i]=Min(255, (A[i] + B[i]))
	static LINEAR_DODGE( color, {r, g, b} = rgb  ){
		r = color.r + r;
		g = color.g + g;
		b = color.b + b;
		return ColorBlender.FIX({r,g,b});
	}
	//浅色（Lighter Color）
	//通过计算混合色与基色所有通道的数值总和，哪个数值大就选为结果色。因此结果色只能在混合色与基色中选择，不会产生第三种颜色。与深色模式刚好相反。
	//当前图层与下方图层相比，颜色浅（RGB总和较小）的显现出来，颜色深的就被隐藏。
	static LIGHTER_COLOR( color, {r, g, b} = rgb  ){
		let eq = color.r + color.g + color.b - r - g - b;
		return {
			r: eq >= 0?color.r:r,
			g: eq >= 0?color.g:g,
			b: eq >= 0?color.b:b
		}
	}
	//----------------------《4》融合型---------------------------
	/**
	 * 叠加
	 * 它是根据基色图层的色彩来决定混合色图层的像素是进行正片叠底还是进行滤色，一般来说，发生变化的都是中间色调，高色和暗色区域基本保持不变。像素是进行正片叠底（Multiply）混合还是屏幕（Screen）混合，取决于基色层颜色。颜色会被混合，但基色层颜色的高光与阴影部分的亮度细节就会被保留
	 //基色 > 128：结果色 = 255 - （255 - 混合色）* (255 - 基色) / 128。
	 */
	 //C[i]={(B[i] < 128) ? (2 * A[i] * B[i] / 255) : (255 - 2 * (255 - A[i]) * (255 - B[i]) / 255)};
	static OVERLAY( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = r0 < 128 ? (2 * r0 * r / 255) : (255 - 2 * (255 - r0) * (255 -r) / 255);
		g = g0 < 128 ? (2 * g0 * g / 255) : (255 - 2 * (255 - g0) * (255 -g) / 255);
		b = b0 < 128 ? (2 * b0 * b / 255) : (255 - 2 * (255 - b0) * (255 -b) / 255);
		return {r,g,b}
	}
	/** 柔光 */
	//将混合色图层以柔光的方式加到基色图层，当基色图层的灰阶趋于高或低，则会调整图层合成结果的阶调趋于中间的灰阶调，而获得色彩较为柔和的合成效果。形成的结果是：图像的中亮色调区域变得更亮，暗色区域变得更暗，图像反差增大类似于柔光灯的照射图像的效果。变暗还是提亮画面颜色，取决于混合层颜色信息。产生的效果类似于为图像打上一盏散射的聚光灯。如果混合层颜色（光源）亮度高于50%灰，基色层会被照亮（变淡）。如果混合层颜色（光源）亮度低于50%灰，基色层会变暗，就好像被烧焦了似的。
	//混合色 >128： 结果色 = 基色 + (2 * 混合色 - 255) * (Sqrt(基色/255)*255 - 基色)/255。

	//计算公式：
	//
	//B < 128 ? (2 * (( A >> 1) + 64)) * (B / 255) : (255 - ( 2 * (255 - ( (A >> 1) + 64 ) ) * ( 255 - B ) / 255 ));

	//混合色 <=128：结果色 = 基色 + (2 * 混合色 - 255) * (基色 - 基色 * 基色 / 255) / 255；
	//混合色 >128： 结果色 = 基色 + (2 * 混合色 - 255) * (Sqrt(基色/255)*255 - 基色)/255。
	static SOFT_LIGHT(  color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;r = r <=128 ?  (r0 + (2 * r - 255) * (r0 - r0 * r0 / 255) / 255):(r0 + (2 * r - 255) * (Math.sqrt(r0/255)*255 - r0)/255)
		g = g <=128 ?  (g0 + (2 * g - 255) * (g0 - g0 * g0 / 255) / 255):(g0 + (2 * g - 255) * (Math.sqrt(g0/255)*255 - g0)/255)
		b = b <=128 ?  (b0 + (2 * b - 255) * (b0 - b0 * b0 / 255) / 255):(b0 + (2 * b - 255) * (Math.sqrt(b0/255)*255 - b0)/255)
		return {r,g,b}
	}
	//强光（Hard Light）
	//如果两层中颜色的灰阶是偏向低灰阶，作用与正片叠底模式类似，而当偏向高灰阶时，则与滤色模式类似。中间阶调作用不明显。正片叠底或者是滤色混合基层颜色，取决于混合层颜色。产生的效果就好像为图像应用强烈的聚光灯一样。如果混合层层颜色（光源）亮度高于50%灰，图像就会被照亮，这时混合方式类似于滤色（Screen）模式。反之，如果亮度低于50%灰，图像就会变暗，这时混合方式就类似于正片叠底（Multiply）模式。该模式能为图像添加阴影。如果用纯黑或者纯白来进行混合，得到的也将是纯黑或者纯白。

　　//计算公式：混合色 > 128 ：结果色 = 255 - （255 - 混合色） * (255 - 基色) / 128。
	//C[i]={(A[i] < 128) ? (2 * A[i] * B[i] / 255) : (255 - 2 * (255 - A[i]) * (255 - B[i]) / 255)};
	static HARD_LIGHT( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = r < 128 ? (2 *  r * r0 / 255) : (255 - 2 * (255 - r) * (255 - r0) / 255);
		g = g < 128 ? (2 *  g * g0 / 255) : (255 - 2 * (255 - g) * (255 - g0) / 255);
		b = b < 128 ? (2 *  b * b0 / 255) : (255 - 2 * (255 - b) * (255 - b0) / 255);
		return {r,g,b}
	}
	//亮光（Vivid Light）
	//调整对比度以加深或减淡颜色，取决于混合层图像的颜色分布。如果混合层颜色（光源）亮度高于50%灰，图像将被降低对比度并且变亮；如果混合层颜色（光源）亮度低于50%灰，图像会被提高对比度并且变暗。
	//混合色 > 128：结果色 =基色/ (2 *(255 -混合色)) * 255。
	//C[i]={B[i] < 128 ?(B[i] == 0 ? 2 * B[i] : Max(0, (255 - ((255 - A[i]) << 8 ) / (2 * B[i])))) : ((2 * (B[i] - 128)) == 255 ? (2 * (B[i] - 128)) : Min(255, ((A[i] << 8 ) / (255 - (2 * (B[i] - 128)) ))))};

	static VIVID_LIGHT( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = r0 < 128 ?(r0 == 0 ? 2 * r0 : Math.max(0, (255 - ((255 - r) << 8 ) / (2 * r0)))) : ((2 * (r0 - 128)) == 255 ? (2 * (r0 - 128)) : Math.min(255, ((r << 8 ) / (255 - (2 * (r0 - 128)) ))));
		g = g0 < 128 ?(g0 == 0 ? 2 * g0 : Math.max(0, (255 - ((255 - g) << 8 ) / (2 * g0)))) : ((2 * (g0 - 128)) == 255 ? (2 * (g0 - 128)) : Math.min(255, ((g << 8 ) / (255 - (2 * (g0 - 128)) ))));
		b = b0 < 128 ?(b0 == 0 ? 2 * b0 : Math.max(0, (255 - ((255 - b) << 8 ) / (2 * b0)))) : ((2 * (b0 - 128)) == 255 ? (2 * (b0 - 128)) : Math.min(255, ((b << 8 ) / (255 - (2 * (b0 - 128)) ))));
		return {r,g,b}
	}
	//线性光（Linear Light）
	//线性光通过减少或增加亮度，来使颜色加深或减淡。具体取决于混合色的数值。如果混合层颜色（光源）亮度高于中性灰（50%灰），则用增加亮度的方法来使得画面变亮，反之用降低亮度的方法来使画面变暗。
　　//计算公式：结果色 = 2 * 混合色 + 基色 -255。数值大于255取255。
	//C[i]=Min(255, Max(0, (B[i] + 2 * A[i]) - 1))
	static LINEAR_LIGHT( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = Math.min( 255, Math.max(0, (r0 + 2* r)-255));
		g = Math.min( 255, Math.max(0, (g0 + 2* g)-255));
		b = Math.min( 255, Math.max(0, (b0 + 2* b)-255));
		return {r,g,b}
	}
	//18.点光（Pin Light）
　　//点光模式她会根据混合色的颜色数值替换相应的颜色。如果混合层颜色（光源）亮度高于50%灰，比混合层颜色暗的像素将会被取代，而较之亮的像素则不发生变化。如果混合层颜色（光源）亮度低于50%灰，比混合层颜色亮的像素会被取代，而较之暗的像素则不发生变化。
	//C[i]=Max(0, Max(2 * B[i] - 255, Min(B[i], 2 * A[i])))
	static PIN_LIGHT( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r =Math.max(0, Math.max(2 * r - 255, Math.min(r0, 2 * r)));
		g =Math.max(0, Math.max(2 * g - 255, Math.min(g0, 2 * g)));
		b =Math.max(0, Math.max(2 * b - 255, Math.min(b0, 2 * b)));
		return {r,g,b}
	}
　　//计算公式：基色
	//2 * 混合色 - 255
	//基色 > 2 * 混合色：结果色 = 2 * 混合色。

	//19，实色/实色混合（Hard Mix)

	//实色混合模式下当混合色比50%灰色亮时，基色变亮；如果混合色比50%灰色暗，则会使底层图像变暗。该模式通常会使图像产生色调分离的效果减小填充不透明度时，可减弱对比强度。
	//C[i]={(B[i] < 128 ?(B[i] == 0 ? 2 * B[i] : Max(0, (255 - ((255 - A[i]) << 8 ) / (2 * B[i])))) : ((2 * (B[i] - 128)) == 255 ? (2 * (B[i] - 128)) : Min(255, ((A[i] << 8 ) / (255 - (2 * (B[i] - 128)) )))))< 128 ? 0 : 255};
	static HARD_MIX( color, {r, g, b} = rgb  ){
		let r0 = color.r,g0 = color.g,　b0 = color.b;
		r = ( r < 128 ?(r == 0 ? 2 * r : Math.max(0, (255 - ((255 - r0) << 8 ) / (2 * r)))) : ((2 * (r - 128)) == 255 ? (2 * (r - 128)) : Math.min(255, ((r0 << 8 ) / (255 - (2 * (r - 128)) )))))< 128 ? 0 : 255;
		g = ( g < 128 ?(g == 0 ? 2 * g : Math.max(0, (255 - ((255 - g0) << 8 ) / (2 * g)))) : ((2 * (g - 128)) == 255 ? (2 * (g - 128)) : Math.min(255, ((g0 << 8 ) / (255 - (2 * (g - 128)) )))))< 128 ? 0 : 255;
		b = ( b < 128 ?(b == 0 ? 2 * b : Math.max(0, (255 - ((255 - b0) << 8 ) / (2 * b)))) : ((2 * (b - 128)) == 255 ? (2 * (b - 128)) : Math.min(255, ((b0 << 8 ) / (255 - (2 * (b - 128)) )))))< 128 ? 0 : 255;
		return {r,g,b}
	}
	//----------------《5》色异型-----------------
	//20，差值
	//差值混合模式将混合色与基色的亮度进行对比，用较亮颜色的像素值减去较暗颜色的像素值，所得差值就是最后效果的像素值。
	//C[i]=Abs(A[i] - B[i])
	static DIFFERENCE( color, {r, g, b} = rgb  ){
		r = Math.abs( color.r - r );
		g = Math.abs( color.g - g );
		b = Math.abs( color.b - b );
		return {r,g,b};
	}
	//21，排除
	//排除混合模式与差值模式相似，但排除模式具有高对比和低饱和度的特点，比差值模式的效果要柔和，明亮。白色作为混合色时，图像反转基色而呈现；黑色作为混合色时，图像不发生变化。
	//C[i]= A[i] + B[i] - 2 * A[i] * B[i] / 255
	static EXCLUSION( color, {r, g, b} = rgb  ){
		r = Math.abs( color.r + r - 2* color.r * r /255 );
		g = Math.abs( color.g + g - 2* color.g * g /255 );
		b = Math.abs( color.b + b - 2* color.b * b /255 );
		return {r,g,b}
	}
	//22.减去（Subtract）
	//减去模式的作用是查看各通道的颜色信息，并从基色中减去混合色。如果出现负数就归为零。与基色相同的颜色混合得到黑色；白色与基色混合得到黑色；黑色与基色混合得到基色。
	//计算公式：结果色 = 基色 - 混合色。
	//C[i]=A[i]-B[i]
	static SUBSTRACT( color, {r, g, b} = rgb  ){
		r = color.r - r;
		g = color.g - g;
		b = color.b - b;
		return {r,g,b}
	}
	//23.划分（Divide）
	//划分模式的作用是查看每个通道的颜色信息，并用基色分割混合色。基色数值大于或等于混合色数值，混合出的颜色为白色。基色数值小于混合色，结果色比基色更暗。因此结果色对比非常强。白色与基色混合得到基色，黑色与基色混合得到白色。
	//计算公式：结果色 = (基色 / 混合色) * 255。
	//C[i]=(A[i]/B[i])*255
	static DIVIDE( color, {r, g, b} = rgb  ){
		r = color.r / r * 255;
		g = color.g / g * 255;
		b = color.b / b * 255;
		return {r,g,b}
	}
	// ------------ 《6》蒙色型----------------------
	//24.色相（Hue）
	//合成时，用混合图层的色相值去替换基层图像的色相值，而饱和度与亮度不变。决定生成颜色的参数包括：基层颜色的明度与饱和度，混合层颜色的色相。（这里用到的色相、饱和度、明度也是一种颜色模式，也称作：HSB模式。）
	//使用HSB数值进行计算，保留混合色的H，也就是色相值；S与B（饱和度与明度）使用基色数值。
	static HUE( color, {r, g, b} = rgb  ){
		let obj = new Color( color );
		//图层色
		let h0 = Color.RGB2HSL( obj.rgba );
		//混合色
		obj.color = {r,g,b};
		let h1 = Color.RGB2HSL( obj.rgba );
		obj.color = {
			h:h1.h, s: h0.s,l:h0.l
		}
		return obj.rgba;
	}
	//25.饱和度（Saturation）
	//用混合图层的饱和度去替换基层图像的饱和度，而色相值与亮度不变。决定生成颜色的参数包括：基层颜色的明度与色相，混合层颜色的饱和度。饱和度只控制颜色的鲜艳程度，因此混合色只改变图片的鲜艳度，不能影响颜色。
	//与色相模式相似，不过保留的混合色的值是S。
	static SATURATION( color, {r, g, b} = rgb  ){
		let obj = new Color( color );
		//图层色
		let h0 = Color.RGB2HSL( obj.rgba );
		//混合色
		obj.color = {r,g,b};
		let h1 = Color.RGB2HSL( obj.rgba );
		obj.color = {
			h:h0.h, s: h1.s,l:h0.l
		}
		return obj.rgba;
	}
	//26.颜色（Color）
	//用混合图层的色相值与饱和度替换基层图像的色相值和饱和度，而亮度保持不变。决定生成颜色的参数包括：基层颜色的明度，混合层颜色的色相与饱和度。这种模式下混合色控制整个画面的颜色，是黑白图片上色的绝佳模式，因为这种模式下会保留基色图片也就是黑白图片的明度。
	//与色相模式相似，不过保留的混合色的值是HS。
	static COLOR( color, {r, g, b} = rgb  ){
		let obj = new Color( color );
		//图层色
		let h0 = Color.RGB2HSL( obj.rgba );
		//混合色
		obj.color = {r,g,b};
		let h1 = Color.RGB2HSL( obj.rgba );
		obj.color = {
			h:h1.h, s: h1.s,l:h0.l
		}
		return obj.rgba;
	}
	//27.明度（Luminosity）
	//用当前图层的亮度值去替换下层图像的亮度值，而色相值与饱和度不变。决定生成颜色的参数包括：基层颜色的色调与饱和度，混合层颜色的明度。跟颜色模式刚好相反，因此混合色图片只能影响图片的明暗度，不能对基色的颜色产生影响，黑、白、灰除外。
	//与色相模式相似，不过保留的混合色的值是B。
	static LUMINOSITY( color, {r, g, b} = rgb  ){
		let obj = new Color( color );
		//图层色
		let h0 = Color.RGB2HSL( obj.rgba );
		//混合色
		obj.color = {r,g,b};
		let h1 = Color.RGB2HSL( obj.rgba );
		obj.color = {
			h:h0.h, s: h0.s,l:h1.l
		}
		return obj.rgba;
	}
}

export default ColorBlender;
export {
	ColorBlender
}