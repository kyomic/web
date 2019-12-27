<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer"></div>
    <div class="tip">参考代码：<em>（注：以下code不是源码，仅为Function.toString()的结果）</em></div>
    <div class="code">
      
    </div>
    <div class="controls">
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item :title="value.name" :name="value.name" v-for="(value,key,index) in filters" :key="index">
          <div class="filter-title">{{value.description}}</div>          
          <div class="filter-options" v-if="value.args">
            <div class="filter-option" v-for="(arg) in value.args">
              {{arg.name}}
              <el-slider v-model="arg.value" :min="arg.min" :max="arg.max" :step="0.01" v-if="arg.type=='number'" @change="applyFilter(value, true)">
              </el-slider>              
            </div>            
          </div>
          <div class="filter-btn">
            <el-button size="mini" type="primary" @click="clearFilter()" title="清除所有滤镜">clear</el-button>
            <el-button size="mini" type="primary" @click="applyFilter(value)" title="当前图像上叠加">apply</el-button>
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
import { BitmapFilter, BitmapFilterDescription } from '@/lib/extends/img/BitmapFilter';
import utils from '@/lib/core/utils'


export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
      code:"",
      data:[1,2,3],
      filters: BitmapFilterDescription,
      a:0.1,
      msg: 'Welcome to Your Vue.js App',
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
    applyFilter( filter, reset =false ){
      console.log("filter", filter)
      if( this.image ){
        if( reset ){
          this.image.clearFilter();
        }
        let args = filter.args || [];
        let option = {};
        args.map(res=>{
          option[ res.name ] = res.value;
        })
        //console.log("fitler.fitler", filter.filter().filter.toString(), option)
        this.image.applyFilter( filter.filter( option ) );
        let code = filter.filter().filter.toString();
        code = prettyJs( code ,{
          indent: "\t",  // Switch to tabs for indentation
          newline: "\r\n"  // Windows-style newlines
        });
        code = utils.encodeHTML( code );
        this.$el.querySelector(".code").innerHTML = "<pre class='hljs'><code class='javascript'>"+ code +"</code></pre>";
        this.$highlight( this.$el, ".code" );
      }
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
