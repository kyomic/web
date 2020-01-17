<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer">
    </div>
    <div class="controls">
      
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
import utils from '@/lib/core/utils'

import WebVideo from '@/lib/extends/player/WebVideo'
import { HLStream } from '@/lib/extends/player/core/stream';
let mountedId = 0;
export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
     
    };
  },

  computed:{
    
  },
  watch:{
    rgb:{
      
    }
  },
  methods:{
    
  },
  mounted(){  
    //整出个bug,多次mounted的问题
    clearTimeout( mountedId )
    mountedId = setTimeout( _=>{
      var dom = document.querySelector(".imglayer")
      let v = new WebVideo({target: dom})    
      let stream = new HLStream( { url:"http://web.fun.tv/demo/test2.m3u8"} )
      v.attachStream( stream );
      v.play(); 
    },2000)
       
    
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
  .imglayer{
    min-width: 100px;
    min-height: 100px;
  }
  
</style>
