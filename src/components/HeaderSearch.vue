<template>
	<div v-if="shown" :class="mobile?'search-full':'search-normal'">
		<el-row>
			<el-col>
				<el-row type="flex" align="middle" justify="space-around">
					<el-input
		                placeholder="请输入内容"
		                v-model="keyword"
		                size="small">
		                <i slot="prefix" class="el-input__icon el-icon-search"></i>
		            </el-input>
		            <i v-if="mobile" class="el-icon-close" @click="onHideSearch"></i>
				</el-row>				
	        </el-col>
		</el-row>
	</div>
	<div v-else class="mod-search mod-search-min">
		<i class="el-icon-search" @click="onShowSearch"></i>
	</div>
</template>
<script>

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Devices from '@/lib/core/Devices';


export default {
  name: 'HeaderSearch',
  data() {
    return {
    	mobile:true,
    	keyword:""
    };
  },
  computed:{
    ...mapState('search', [
        'shown'
    ])
  },
  methods:{
  	...mapMutations("search", ["showSearch"]),
  	onShowSearch(){
  		this.showSearch( true );
  	},
  	onHideSearch(){
  		this.showSearch( false );
  	},
  	checkSize(){
  		let code = Devices.getInstance().grid24code;
  		if( !code || code.indexOf('xs')==-1){
  			this.showSearch( true );
  			this.mobile = false;
  		}else{
  			this.showSearch( false );
  			this.mobile = true;
  		}
  		console.log("closeabled", this.closeabled, this.shown, 'code=', code)
  	}
  },
  mounted(){
  	Devices.getInstance().on('resize', this.checkSize );
  	Devices.getInstance().on('load', this.checkSize );
  	this.checkSize();
    console.log("HeaderSearch is mounted")
  }
};
</script>
<style scoped>
	.el-icon-close{
		font-size: 22px;
	}
	.mod-search{
		display: inline-block;
	}
	.search-full{
		width: 100%;
		position: absolute;
		background:white;
		left: 0;top: 0;
	}
	.search-normal{
		width: 100%;
	}
</style>