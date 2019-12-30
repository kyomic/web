<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer"></div>
    <div class="controls">
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item title="HSL调节" name="hsl">
          <div class="filter-title">调整HSL颜色</div>          
          <div class="filter-options">
            <div class="filter-option">色相(H):         
              <el-slider v-model="hsl.h" :min="-180" :max="180" @change="applyHSL('h')"></el-slider>              
            </div> 
            <div class="filter-option">饱和度(S):         
              <el-slider v-model="hsl.s" :min="-100" :max="100" @change="applyHSL('s')"></el-slider>              
            </div> 
            <div class="filter-option">亮度(L):         
              <el-slider v-model="hsl.l" :min="-100" :max="100" @change="applyHSL('l')"></el-slider>              
            </div>  
            <div class="filter-option">对比度(V):         
              <el-slider v-model="hsl.v" :min="-100" :max="100" @change="applyHSL('v')"></el-slider>              
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
      code:"",
      hsl:{h:0,s:0,l:0,v:0}
    };
  },
  methods:{
    onBrowser(e){
      let input = e.target;
      let files = input.files;
      let file = files[0];
      console.log("URL", file.toDataURL());
      console.log("files", files)
    },
    applyHSL( name ){
      let self = this;
      let matrix = new ColorMatrix();
      matrix.adjustBrightness( this.hsl.l );
      matrix.adjustSaturation( this.hsl.s );
      matrix.adjustHue( this.hsl.h );
      matrix.adjustContrast( this.hsl.v );
      let filter = new BitmapFilter( BitmapDataFilter.applyColorMatrix, {matrix} );
      window.__image.clearFilter();
      window.__image.applyFilter( filter );
      //let newbitmap = filter.render( window.__image.bitmap )
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
    console.log("filter....loaded")
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
</style>
