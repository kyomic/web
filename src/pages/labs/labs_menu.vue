<template>
	<el-collapse v-model="activeName" accordion>		
		<el-collapse-item title="字节流" name="layer_bytearray">
	    	<div><router-link to="/labs/bytearray">AS3的字节流</router-link></div>
		</el-collapse-item>
		<el-collapse-item title="颜色" name="layer_color">
	    	<div><router-link to="/labs/color">颜色调整</router-link></div>
		</el-collapse-item>
	    <el-collapse-item title="图形图像" name="layer_blender">
	    	<div><router-link to="/labs/image_rgb">位图颜色调整</router-link></div>
			<div><router-link to="/labs/image_filter">位图滤镜</router-link></div>
			<div><router-link to="/labs/image_filter_convolution">位图卷积滤镜</router-link></div>
			<div><router-link to="/labs/image_blender">图层混合模式</router-link></div>
		</el-collapse-item>
		<el-collapse-item title="流媒体" name="media">
	    	<div><router-link to="/labs/media_video">视频测试</router-link></div>
		</el-collapse-item>
		<el-collapse-item title="测试" name="layer_test">
	    	<div><router-link to="/labs/color_ui">test</router-link></div>
		</el-collapse-item>
	</el-collapse>
</template>