<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer">
      颜色：{{colorstr}}
      <div class="colorbox" :style="{backgroundColor: colorstr }"></div>
    </div>
    <div class="controls">
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item title="RGB颜色调节" name="hsl">
          <div class="filter-title">调整RGB颜色</div>          
          <div class="filter-options">
            <div class="filter-option">红(R):         
              <el-slider v-model="rgb.r" :min="0" :max="255"></el-slider>              
            </div> 
            <div class="filter-option">绿(G):         
              <el-slider v-model="rgb.g" :min="0" :max="255"></el-slider>              
            </div> 
            <div class="filter-option">蓝(B):         
              <el-slider v-model="rgb.b" :min="0" :max="255"></el-slider>              
            </div>    
          </div>         
        </el-collapse-item>

        <el-collapse-item title="HSL颜色调节" name="hsl">
          <div class="filter-title">调整HSL颜色</div>          
          <div class="filter-options">
            <div class="filter-option">色相(H):         
              <el-slider v-model="hsl.h" :min="0" :max="360" @input="applyColorHSL()"></el-slider>              
            </div> 
            <div class="filter-option">饱和度(S):         
              <el-slider v-model="hsl.s" :min="0" :max="1" step="0.01" @input="applyColorHSL()"></el-slider>              
            </div> 
            <div class="filter-option">亮度(L):         
              <el-slider v-model="hsl.l" :min="0" :max="1" step="0.01" @input="applyColorHSL()"></el-slider>              
            </div>    
          </div>         
        </el-collapse-item>
      </el-collapse>
      <div class="filter-btn">
        <el-button size="mini" type="primary" @click="clearFilter()">clear</el-button>
      </div>
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
import {BitmapDataFilter} from '@/lib/extends/img/BitmapDataFilter'
import { BitmapFilter, BitmapFilterDescription } from '@/lib/extends/img/BitmapFilter';
import { ColorFilter } from '@/lib/extends/img/ColorFilter';
import ColorMatrix from '@/lib/extends/img/ColorMatrix';


import utils from '@/lib/core/utils'


export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
      rgb:{
        r: Math.round(Math.random()*255),
        g: Math.round(Math.random()*255),
        b: Math.round(Math.random()*255)        
      },
      hsl:{}
    };
  },

  computed:{
    colorstr:function(){
      let color = this.rgb;
      //console.log("rgb",color, (( color.r <<16) | (color.g << 8) | color.b).toString(16))
      return '#' + (( color.r <<16) | (color.g << 8) | color.b).toString(16).padStart(6,'0');
    }
  },
  watch:{
    rgb:{
      handler:function(c){
        let color = new Color( c );
        this.hsl = Color.RGB2HSL( color.rgba );
        console.log("hsl", this.hsl.h, this.hsl.s, this.hsl.l)
      },deep:true
    }
  },
  methods:{
    applyColorRGB(){

    },
    applyColorHSL(  ){
      console.log("HSL", this.hsl)
      let color = new Color( this.hsl );      
      this.rgb = color.rgba;
    },
    applyFilter( filter, reset =false ){
      
    },
    clearFilter(){
      if( this.image ){
        this.image.clearFilter();
      }
    }
  },
  mounted(){    
    console.log("filter....loaded", this.colorstr)
    this.hsl = Color.RGB2HSL( this.rgb );
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

  .mobile .controls{
    width: 150*@rem;
  }
</style>
