<template>
  <div class="page-wrap">
    <div class="article-item" style="display:none">
      <p><span class="label">[vx]: </span>kyomic</p>
      <p><span class="label">[mail]: </span>kyomic[@]163.com</p>
      <p><span class="label">[twitter]: </span><a href="https://twitter.com/bytearray/" target="_blank">https://twitter.com/bytearray/</a></p>
      <div class="social-link">
        <a href="#" class="github"></a>
        <a href="#" class="weixin"></a>
        <a href="#" class="twitter"></a>
        <a href="#" class="mail"></a>
        <a href="#" class="rss"></a>
      </div>
    </div>

    <div class="test" style="display:none">
      <input type="file" @change="onBrowser($event)" />
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
import KSlider from '@/components/KSlider';
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



export default {
  name: 'HelloWorld',
  components:{ KSlider },
  data() {
    return {
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
        console.log("fitler.fitler", filter.filter, option)
        this.image.applyFilter( filter.filter( option ) );
      }
    },
    clearFilter(){
      if( this.image ){
        this.image.clearFilter();
      }
    }
  },
  mounted(){
    /*
    var color = new Color("rgba(255,255,0,0.1)");
    //color.color = 'hsl(120,100%,50%)'
    color.color = {r:255,g:0,b:255};
    console.log("color", color+"", color.alpha, color.rgba, color.hslstring, color.rgbstring );
    return;
    */
    setTimeout(()=>{
      this.data=['a','b','c','d','e']
    },5000)
    this.$animate();
    /*
    var blob = new Blob(['他'], { type: 'text/plain' });
    console.log("****blob", blob)
    var buffer = blobtoArrayBuffer(blob).then(res=>{
      console.log("读取buffer===", res)
      var buf = new Uint8Array(res);
      console.log("buffer", buf)

      var reader = new FileReader();
      reader.onload = function () {
          console.info(reader.result); //中文字符串
      };
      reader.readAsText(new Blob([buf]), 'utf-8');
      
      var text = bufferUtils.Uint8ArrayToString( res );
      console.log("text", text)
    })
    console.log("buffer",buffer)

    console.log( "转字节",bufferUtils.intToByte(255));
    return;
    */
    let img = new KImage();
    let url = "http://api.shareme.cn/blog_attachment/?id=205";
    if( !window.__image ){
      this.image = window.__image;
    }
    if( !window.__image ){
      img.load( url ).then( res=>{
        document.body.appendChild( img.canvas );
        this.image = img;
        window.__image = img;
      })
    }else{
      this.image = window.__image;
    }
    return;
    
    let img2 = new KImage();
    let self = this;
    var canvas = document.createElement('canvas')
    if (canvas.toBlob) {
      canvas.toBlob( function( blob ){
        console.log("blob",blob)
        console.log("objecturl", img.createObjectURL(blob));
        img.load( blob ).then(res=>{
          console.log("read blob img===",res.width, res.height, img )
          let url = img.dataUrl;
          
          img2.load( url ).then(_=>{
            console.log("img2=", img2,_, self.image)

            if( !self.image ){
              document.body.appendChild( img2.canvas );
              self.image = img2;
            }
            
            
            //img2.applyFilter( BitmapFilter.gray() );
            //img2.clearFilter();

          })
        }).catch(e=>{
          console.log("read blob error",e)
        })
      }, 'image/jpeg');
      
    }


  }
}

</script>
<style lang="less">
  .el-collapse-item__header{
    padding-left: 10px;
  }
  canvas1{
    width:400px;
    height: 300px;
  }
</style>
<style lang="less" scoped>

  .kslider .item{
    height: 100px;
  }
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
  
  .el-collapse-item {
    background: red;
    
    
  }
  

  .controls{
    width: 100*@rem;
    position: fixed;
    right: 0;
    top: 50*@rem;
    .filter-title{
      padding-left: 5*@rem;color: #ccc;
    }
    .filter-options{
      padding: 5*@rem;
    }
    .filter-btn{
      background: white;
      padding: 5*@rem;
    }
  }
</style>
