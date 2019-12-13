<template>
	<div :class="visible?'com-viewer com-viewer-show':'com-viewer'">
		<div class="wrapper">
			<KSlider class="kslider" :pager="false" >
      	<div v-for="(item,index) in data" :class="'item '+ item" :style="'height:'+viewHeight+'px'">
          <img :src="item" />
        </div>
	    </KSlider>
      <i class="el-icon-circle-close close" @click="onHide"></i>
		</div>		
	</div>
</template>
<script>
	let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
	import KSlider from '@/components/KSlider'
import Devices from '@/lib/core/Devices';

export default {
  name: 'KViewer',
  components:{KSlider},
  data() {
    return {
      data:[],
      visible:false,
      viewWidth:0,
      viewHeight:Devices.getInstance().viewSize.height,
    };
  },
  props:{
  	show:{
  		type:Boolean,default:false, required:false
  	},
  	images:{
  		type:Array,required:true, 
  		default:function(){
  			return []
  		},
  	}
  },
  watch:{
    show(val){
      this.visible = val;
    },
    images(val){
      this.data = (val||[]).concat();
    }
  },
  methods:{
    onHide(){
      this.images = [];
      this.visible = false;
      this.$emit('hide');
    },
    onPageChange( page ){
      this.$emit('current-change', page);
    }
  },
  mounted(){
    let device = Devices.getInstance();
    device.on('load', (e)=>{
      this.viewWidth = device.viewSize.width;
      this.viewHeight = device.viewSize.height;
    })
    let size = device.viewSize;
    this.viewWidth = size.width;
    this.viewHeight = size.height;

  }
};
</script>
<style lang="less" scoped>
	.com-viewer{
		position: absolute;
    width: 100%;
    height: 100%;
    background-color: #cccccc;
    z-index: 999;
    left:-10000px;
    opacity: 0;
    display: none;
    .transition(opacity);

    .mod-slider{
      background: black;
    }
	}
  .item{
    display: flex;
    align-items: center;
    justify-content:center;
    img{
      width:100%;
    }
  }
	.com-viewer-show{
		opacity: 1;
		position: fixed;
		top: 0;
    left: 0;
    display: block;
	}
  .close{
    position: fixed;
    z-index: 1000;
    top: 5*@rem;
    right: 5*@rem;
    font-size: 24*@rem;
    color: white;
  }
</style>

    