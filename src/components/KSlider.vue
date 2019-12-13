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
    <i v-if="pager" class="prev el-icon-caret-left" @click="prevPage"></i>
    <i v-if="pager" class="next el-icon-caret-right" @click="nextPage"></i>    
	</div>
</template>

<script>
let animationDuration = 500;
let slotsLength = 0;
let currentCls = 'slider-current';
import dom from '@/lib/core/dom'
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
    pager:{
      type:Boolean,default:true, required:false
    },
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
      e.preventDefault();
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
      /** 1/4拖动效果*/
      if( offset <0 ){
        middle = this.width / 4;
      }else{
        middle = this.width * 3/4
      }
      /** 1/4拖动效果*/
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
      if( this.pageIndex >= this.childs.length ){
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
    afterUpdate(){
      let idx = this.pageIndex;
      let root = this.$refs["mod-slider"];
      let content = root.querySelector(".content");
      Array.from(content.childNodes).filter(res=>res.nodeType==1).map((res,i)=>{
        let id = i % slotsLength;
        if( id == idx ){
          dom.addClass(res,currentCls)
        }else{
          dom.removeClass(res,currentCls)
        }        
      })
    },

    onUpdated( force = false){
      let length = 0;
      if( this.$slots && this.$slots.default ){
        length = this.$slots.default.length;
      }

      let root = this.$refs["mod-slider"];
      let content = root.querySelector(".content");


      if( length <= 0 ){
        content.innerHTML ="";
        slotsLength = 0;
      }
      debug && console.log("UPDATE:", length)
      if( length && (slotsLength != length || force) ){
        slotsLength = length;
        
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
        this.childs = childs;
        this.height = height;
        this.width = width;

        debug && console.log("新的子节点", childs, "单条宽度:", this.width)
        this.childs = childs;        
        let code = childs.reduce((current,value,index,arr)=>{
          return current + value.outerHTML
        },'');
        content.innerHTML = [code,code,code].join('');
        content.style.width = this.width * this.childs.length *3 + 'px';
        this.redraw();
      }
      this.afterUpdate();
      
    },
    redraw(){
      let root = this.$refs["mod-slider"].querySelector(".content");
      if( root ){
        Array.from(root.childNodes).map((res,i)=>{
          res.style.width = this.width + "px"
        })
      }  
      this.initOffset = -(this.childs.length * this.width);
    }
  },
  beforeUpdate(){    
  },
  updated(){
    this.onUpdated();
  },
  mounted(){
    this.onUpdated( true );
  }
};
</script>
<style lang="less" scoped>
	.mod-slider{
    position: relative;
    width: 100%;
    height: 100%;
    /*background: white;*/
    overflow: hidden;
    .content{
      transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
      transform: translate(0, 0px) translateZ(0px); 

      >div{
        float:left;
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
    .content .item{
      .transition(all);
    }
    .slider-current{
      /*background-color: white;*/
    }
  
    .btn{
      padding: 5*@rem;
      position: absolute;
      top: 50%;
      font-size: 16*@rem;
      margin-top: -(5+24)/2*@rem;
      border: 1px solid #ccc;
      border-radius: 10*@rem;
    }
    .prev{
      .btn();
      left: 5*@rem;
    }
    .next{
      .btn();
      right: 5*@rem;
    }
    .dot-pager{
      position: absolute;
      bottom: 5*@rem;
      text-align: center;
      width: 100%;
      line-height: 100%;
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