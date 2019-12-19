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

    <div class="test">
      <input type="file" @change="onBrowser($event)" />
    </div>
    
  </div>


</template>

<script>
import KSlider from '@/components/KSlider';
import {dataURLtoBlob} from '@/lib/extends/img/canvas-to-blob.js';

import KImage from '@/lib/extends/img/KImage';
export default {
  name: 'HelloWorld',
  components:{ KSlider },
  data() {
    return {
      data:[1,2,3],
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
    }
  },
  mounted(){

    setTimeout(()=>{
      this.data=['a','b','c','d','e']
    },5000)
    this.$animate();

    let img = new KImage();
    
    let img2 = new KImage();
    var canvas = document.createElement('canvas')
    if (canvas.toBlob) {
      canvas.toBlob( function( blob ){
        console.log("blob",blob)
        console.log("objecturl", img.createObjectURL(blob));
        img.load( blob ).then(res=>{
          console.log("read blob img===",res.width, res.height, img )
          let url = img.dataUrl;
          url = "http://api.shareme.cn/blog_attachment/?id=205";
          img2.load( url ).then(_=>{
            console.log("img2=", img2,_)
            //document.body.appendChild( img2.source );
          })
        }).catch(e=>{
          console.log("read blob error",e)
        })
      }, 'image/jpeg');
      
    }
  }
}

</script>

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

  
</style>
