<template>
	<div class="com-scrollview" @scroll="onScrollHandler($event)" @click="onClick" ref="scroll">
		<div class="wrapper">
			<slot></slot>
			<i v-if="loading" class="el-icon-loading"></i>
		</div>		
	</div>
</template>
<script>

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Devices from '@/lib/core/Devices';


export default {
  name: 'ScrollView',
  data() {
    return {
    };
  },
  props:{
  	loading:{
  		type:Boolean,default:false, required:false
  	},
  	onReachBottom:{
  		type:Function,required:false,
  	}
  },
  computed:{},
  methods:{
  	onClick:function(){
  		console.log(this)
  	},
  	onScrollHandler:function(e){
  		let dom = e.target;
  		let scrollTop = dom.scrollTop;
  		let scrollHeight = dom.scrollHeight;
  		let viewHeight = dom.offsetHeight;
  		if( scrollTop >= scrollHeight - viewHeight ){
  			this.onReachBottom && this.onReachBottom();
  		}
  	}
  },
  mounted(){
  	console.log("###################", this.$refs)
  }
};
</script>
<style scoped>
	.com-scrollview{
		height: 100%;
		width: 100%;
		overflow-x: hidden;
		overflow-y: scroll;
		position: absolute;
	}
	.wrapper{

	}
</style>