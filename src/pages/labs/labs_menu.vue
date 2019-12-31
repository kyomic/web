<template>
	<el-collapse v-model="activeName" accordion>
		<el-collapse-item title="颜色" name="layer_color">
	    	<div><router-link to="/labs/color">颜色调整</router-link></div>
		</el-collapse-item>
	    <el-collapse-item title="图形图像" name="layer_blender">
	    	<div><router-link to="/labs/image_rgb">位图颜色调整</router-link></div>
			<div><router-link to="/labs/image_filter">位图滤镜</router-link></div>
			<div><router-link to="/labs/image_blender">图层混合模式</router-link></div>
		</el-collapse-item>
	</el-collapse>
</template>