<template>
	<div>
		<el-row v-if="!show">
			<i class="el-icon-search" @click="onShowSearch"></i>
		</el-row>
		<el-row v-if="show">
			<el-col>
				<el-row type="flex" align="middle" justify="space-around">
					<el-input
		                placeholder="请输入内容"
		                v-model="keyword"
		                size="small">
		                <i slot="prefix" class="el-input__icon el-icon-search"></i>
		            </el-input>
		            <i v-if="closeabled" class="el-icon-close" @click="onHideSearch"></i>
				</el-row>				
	        </el-col>
		</el-row>
	</div>
</template>
<script>

import Devices from '@/lib/core/Devices';


export default {
  name: 'HeaderSearch',
  data() {
    return {
    	show:false,
    	closeabled: true,
    	keyword:""
    };
  },
  methods:{
  	onShowSearch(){
  		this.show = true;
  	},
  	onHideSearch(){
  		this.show = false;
  	},
  	checkSize(){
  		let code = Devices.getInstance().grid24code;
  		if( code && code.indexOf('xs')!=-1){
  			this.show = false;
  			this.closeabled = true;
  		}else{
  			this.show = true;
  			this.closeabled = false;
  		}
  	}
  },
  mounted(){
  	Devices.getInstance().on('resize', this.checkSize );
  	this.checkSize();
    console.log("HeaderSearch is mounted")
  }
};
</script>
<style scoped>
	.el-icon-close{
		font-size: 22px;
	}
</style>