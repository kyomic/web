<template>
	<div class="mod-slider" ref="mod-slider">
    <div class="content"
      @touchstart="onDragStart($event)"
      @touchmove ="onDrag($event)"
      @touchend = "onDragEnd($event)"

      :style="{transform: 'translate('+ offset +'px, 0px)', 'transition-duration': duration+'ms'}"
    >
      <slot></slot>
    </div>
    <div class="dot-pager">
      <div class="dot" v-for="(item,index) in childs" :class="index==pageIndex?'current':''">
        <i></i>
      </div>
    </div>
    <i class="prev el-icon-caret-left" @click="prevPage"></i>
    <i class="next el-icon-caret-right" @click="nextPage"></i>    
	</div>
</template>

<script>
let animationDuration = 500;
export default {
  name: 'KSlider',
  components:{},
  data() {
    return {
      width:0,height:0,
      childs:[],
      isTouchStart:false,//是否按下
      isDrag:false, //是否拖动
      dragStartX:0,
      dragOffset:0,
      initOffset:0,
      pageIndex:0, //当页数
    };
  },
  props:{
  	loading:{
  		type:Boolean,default:true, required:false
  	},
  	data:{
  		type:Array,required:false, 
  		default:function(){
  			return []
  		},
  	}
  },
  computed:{
    offset(){
      let start = this.initOffset - this.pageIndex * this.width;
      if( ! this.dragOffset ){
        return start;
      }
      return start + this.dragOffset;
    },
  	duration:function(){
      if( this.isDrag ){
        return 0;
      }
      return animationDuration
    }
  },
  methods:{
    onDragStart(e){
      this.isTouchStart = true;
      this.dragStartX = e.changedTouches[0].clientX;
    },
    onDrag(e){
      if( this.isTouchStart ){
        this.isDrag = true;
      }
      let pt = e.changedTouches[0].clientX;
      let offset = pt - this.dragStartX;
      this.dragOffset = offset;
    },
    onDragEnd(e){
      this.isTouchStart = this.isDrag = false;

      let offset = this.dragOffset;
      let middle = this.width /2;
      this.pageIndex -= Math.floor((offset + middle)/this.width);
      this.dragOffset = 0;
      this.update();
    },
    nextPage(){
      this.isDrag = false;
      this.pageIndex += 1;
      this.update();
    },
    prevPage(){
      this.isDrag = false;
      this.pageIndex -= 1;
      this.update();
    },
    update(){
      if( this.pageIndex > this.childs.length ){
        setTimeout(()=>{
          this.isDrag = true;
          this.pageIndex = 0;
        },animationDuration)
      }
      if( this.pageIndex <0 ){
        setTimeout(()=>{
          this.isDrag = true;
          this.pageIndex = this.childs.length - 1;
        },animationDuration)
        //this.index = this.childs.length - 1;
      }     
    },
    redraw(){
      let root = this.$refs["mod-slider"].querySelector(".content");
      let childs = Array.from(root.childNodes).filter(res=>res.nodeType==1);
      childs.map(res=>{
        res.style.width = this.width + "px"
      })      
      this.initOffset = -(this.childs.length * this.width);
    }
  },
  mounted(){
    let root = this.$refs["mod-slider"];
    let content = root.querySelector(".content");

    let childs = (this.$slots.default || []).filter(res=>{
      return res && res.elm && res.elm.nodeType ==1 ;
    })
    childs = childs.map(res=> res.elm );
    let height = root.offsetHeight;
    let width  = root.offsetWidth;
    if( !height && childs && childs.length ){
      height = childs[0].offsetHeight;
    }
    
    if( !height ){
      throw new Error("*** 请设置KSlider下子元素高度或者KSlider本身高度 ***");
    }
    this.height = height;
    this.width = width;
    this.childs = childs;
    let code = content.innerHTML;
    content.innerHTML = [code,code,code].join('');
    content.style.width = this.width * this.childs.length *3 + 'px';
    this.redraw();
  }
};
</script>
<style lang="less">
	.mod-slider{
    position: relative;
    width: 100%;
    height: 100%;
    background: #ccc;
    .content{
      transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
      transform: translate(0, 0px) translateZ(0px); 

      >div{
        float:left;
        height: 100%;
        transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
        transition-duration: 0ms;
        transform: translate(0, 0px) translateZ(0px);
      }      
    }
    .content:after{
      clear:both;
      content:" ";
      display:block;
      font-size:0;
      height:0;
      visibility:hidden;
    }
    .content{
      *zoom:1;
    }
  
    .btn{
      padding: 5*@rem;
      position: absolute;
      top: 50%;
      font-size: 16*@rem;
      margin-top: -(5+16)/2*@rem;
      border: 1px solid #ccc;
      border-radius: 10*@rem;
    }
    .prev{
      .btn();
      left: 0;
    }
    .next{
      .btn();
      right: 0;
    }
    .dot-pager{
      position: absolute;
      bottom: 0;
      text-align: center;
      width: 100%;
      >.dot{
        display: inline-block;
      }
      i{
        width: 5*@rem;
        height: 5*@rem;
        border-radius: 5*@rem;
        background-color: #909399;
        display: block;
        opacity: 0.8;
        .transition(width);
      }
      .dot+.dot{
        margin-left: 5*@rem;
      }
      .current i{
        width:15*@rem;
        background-color: #409eff;
      }
    }
  }
</style>