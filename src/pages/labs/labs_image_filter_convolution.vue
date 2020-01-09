<template>
  <div class="wrapper">
    <p>卷积滤镜<br />
      AS3类包 flash.filters.ConvolutionFilter;


    </p>
    <div class="imglayer" ref="imglayer"></div>
    <div class="controls">
      Matrix:
      <div>
        <el-input size="mini" class="tile" v-model="matrix.a00" />
        <el-input size="mini" class="tile" v-model="matrix.a01" />
        <el-input size="mini" class="tile" v-model="matrix.a02" />
      </div>
      <div>
        <el-input size="mini" class="tile" v-model="matrix.a10" />
        <el-input size="mini" class="tile" v-model="matrix.a11" />
        <el-input size="mini" class="tile" v-model="matrix.a12" />
      </div>
      <div>
        <el-input size="mini" class="tile" v-model="matrix.a20" />
        <el-input size="mini" class="tile" v-model="matrix.a21" />
        <el-input size="mini" class="tile" v-model="matrix.a22" />
      </div>
      <div :style="{marginBottom:'10px'}"></div>
      <div>
        divisor:<el-input size="mini" class="tile" v-model="divisor" />
        bias:<el-input size="mini" class="tile" v-model="bias" />
      </div>
      <div :style="{marginBottom:'10px'}"></div>
      <el-button @click="blur()" size="mini" class="btn" type="primary" >模糊</el-button>
      <el-button @click="sharpen()" size="mini" class="btn" type="primary" >锐化</el-button>
      <el-button @click="edge_enhancement()" size="mini" class="btn" type="primary" >强化边缘</el-button>
      <el-button @click="find_edge()" size="mini" class="btn" type="primary" >查找边缘</el-button>
      <el-button @click="emboss()" size="mini" class="btn" type="primary" >浮雕</el-button>
      <el-button @click="clear()" size="mini" class="btn" type="primary" >清除所有滤镜</el-button>
    </div>  
  </div>


</template>

<script>

let prettyJs = require('pretty-js');
import {
  dataURLtoBlob,
  arrayBufferToBlob,
  dataURLtoArrayBuffer,
  blobtoArrayBuffer
} from '@/lib/extends/img/canvas-to-blob.js';
import bufferUtils from '@/lib/extends/img/bufferUtils';

import KImage from '@/lib/extends/img/KImage';
import Color from '@/lib/extends/img/Color';
import { BitmapFilter, BitmapFilterDescription } from '@/lib/extends/img/BitmapFilter';
let { Matrix, Matrix2D } = require("@/lib/extends/img/geom")
import utils from '@/lib/core/utils'
export default {
  name: 'HelloWorld',
  title:"convolution滤镜测试",
  components:{},
  data() {
    return {
      bias:0,
      divisor:1,
      matrix:{a00:1,a01:1,a02:1,a10:1,a11:1,a12:1,a20:1,a21:1,a22:1}
    };
  },

  computed:{
    matrix_data(){
      let m = this.matrix;
      return [
        [ m.a00, m.a01, m.a02],
        [ m.a10, m.a11, m.a12],
        [ m.a20, m.a21, m.a22],
      ]
    }
  },
  watch:{
    matrix_data:function(arr){
      console.log("matrix", arr)
      
      this.image.applyFilter( BitmapFilter.convolution({ matrix: this.matrix_data, divisor:this.divisor,bias:this.bias }));
    },
    divisor:function(){
      this.image.applyFilter( BitmapFilter.convolution({ matrix: this.matrix_data, divisor:this.divisor,bias:this.bias }));
    }
  },
  methods:{
    clear(){
      this.image.clearFilter();
    },
    blur(){
      let matrix0 = {
        a00:1,a01:1,a02:1,
        a10:1,a11:1,a12:1,
        a20:1,a21:1,a22:1
      }
      let matrix1 = {
        a00:1,a01:2,a02:1,
        a10:2,a11:4,a12:2,
        a20:1,a21:2,a22:1
      }
      this.divisor = 9;
      this.matrix = Math.random()>0.5? matrix0:matrix1
    },
    sharpen(){
      let matrix0 = {
        a00:-1,a01:-1,a02:-1,
        a10:-1,a11:9,a12:-1,
        a20:-1,a21:-1,a22:-1
      }
      let matrix1 = {
        a00:0,a01:-1,a02:0,
        a10:-1,a11:5,a12:-1,
        a20:0,a21:-1,a22:0
      }
      this.divisor = 1;
      this.matrix = Math.random()>0.5? matrix0:matrix1
    },
    edge_enhancement(){
      let matrix0 = {
        a00:0,a01:0,a02:0,
        a10:-1,a11:1,a12:0,
        a20:0,a21:0,a22:0
      }
      this.divisor = 1;
      this.matrix =matrix0
    },
    find_edge(){
      let matrix0 = {
        a00:0,a01:1,a02:0,
        a10:1,a11:-4,a12:1,
        a20:0,a21:1,a22:0
      }
      let matrix1 = {
        a00:-1,a01:-1,a02:-1,
        a10:-1,a11: 8,a12:-1,
        a20:-1,a21:-1,a22:-1
      }
      let matrix2 = {
        a00:1,a01:-2,a02:1,
        a10:-2,a11: 4,a12:-2,
        a20:1,a21:-2,a22:1
      }
      let matrixs = [matrix0,matrix1,matrix2]
      this.divisor = 1;
      this.matrix = matrixs[ Math.floor(Math.random()*3) ]
    },
    emboss(){
      let matrix0 = {
        a00:-2,a01:-1,a02:0,
        a10:-1,a11:1,a12:1,
        a20:0,a21:1,a22:2
      }
      this.divisor = 1;
      this.matrix = matrix0
    }
  },
  mounted(){
    
    let img = new KImage();
    let url = "http://www.shareme.cn/assets/labs/Hydrangeas.jpg";
    if( !window.__image ){
      this.image = window.__image;
    }
    if( !window.__image ){
      img.load( url ).then( res=>{
        this.$refs["imglayer"].appendChild( img.canvas );
        this.image = img;
        window.__image = img;
      })
    }else{
      this.image = window.__image;
      let canvas = this.$refs["imglayer"].querySelector("canvas");
      if( !canvas ){
        this.$refs["imglayer"].appendChild( this.image.canvas );
      }
    }   
    document.title = this.$options.title;
  }
}

</script>
<style lang="less">  
  canvas1{
    width:400px;
    height: 300px;
  }
</style>
<style lang="less" scoped>  
  .label{
    display: inline-block;
    width:80*@rem;
    text-align: right;
    margin-right: 5*@rem;
  }
  .kslider span{
    display: block;
    height: 100%;
    border: 1px solid red;
  }
  .code{
    margin-right: 450*@rem;
  }
  .mobile .code{
    margin-right: 0;
  }
  .colorbox{
    width:100*@rem;
    height: 100*@rem;
  }
  .controls{
    padding: 5*@rem;
  }
  .mobile .controls{
    width: 150*@rem;
  }
  .tile{
    width: 30%;
  }
  .btn{
    display: block;
    margin-bottom: 5*@rem;
  }
  .el-button+.el-button{
    margin-left: 0;
  }
</style>
