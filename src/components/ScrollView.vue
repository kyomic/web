<template>
	<div class="com-scrollview" @scroll="onScrollHandler($event)" @click="onClick" ref="scroll">
		<div class="wrapper">
			<slot></slot>
			<i v-if="loading" class="el-icon-loading"></i>
		</div>		
	</div>
</template>
<script>

let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
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
    scrollTop:{
      type:Number,default:0,required:false
    }
  },
  computed:{},
  methods:{
  	onClick:function(){
  		debug && console.log(this)
  	},
  	onScrollHandler:function(e){
  		let dom = e.target;
  		let scrollTop = dom.scrollTop;
  		let scrollHeight = dom.scrollHeight;
  		let viewHeight = dom.offsetHeight;
      this.onScroll && this.onScroll(e);
      debug && console.log("scroll.........", scrollTop, scrollHeight, scrollHeight - viewHeight)
      this.$emit('scroll', e);
  		if( scrollTop >= scrollHeight - viewHeight ){
  			this.$emit('reachbottom', e);
  		}
  	}
  },
  mounted(){
    this.$refs.scroll.scrollTop = this.scrollTop;
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