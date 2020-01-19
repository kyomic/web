<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer">
      <input type="file" @change="onChange($event)" />
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
import { HLStream, BufferStream,URLStream } from '@/lib/extends/player/core/stream';
import { FileReferenceProvider } from '@/lib/extends/player/data'
let mountedId = 0;
let player = null;
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
    onChange(e){
      let file = e.target;
      let files = file.files || [];
      if( files.length || true ){
        window.debughost = "https://cctv5alih5c.v.myalicdn.com/";
        window.debugstream = "https://cctv5alih5c.v.myalicdn.com/live/cdrmcctv5_1td.m3u8";

        window.debugstream = "http://vss.cbnmtv.com/live/yt_cctv1_h_1.m3u8?channelid=yt_cctv1_h"
        window.debughost = /(https?:\/\/[^\/]+)/.exec(window.debugstream)[1] + "/";
        //let stream = new BufferStream( new FileReferenceProvider( { files:files } ) )
        let stream = new HLStream({url:"http://web.fun.tv/demo/playlist_v-0144p-0100k-libx264.m3u8"})

        stream = new HLStream({url: "http://web.fun.tv/proxy.php?url="+ encodeURIComponent(window.debugstream)})
        //let stream = new URLStream( {url: files[0] })
        //let stream = new URLStream( {url: "http://web.fun.tv/demo/test.mp4" })
        player.attachStream( stream );
        player.play();
      }
       
    }
  },
  mounted(){  
    //整出个bug,多次mounted的问题
    clearTimeout( mountedId )
    mountedId = setTimeout( _=>{
      var dom = document.querySelector(".imglayer")
      player= new WebVideo({target: dom})    
      this.onChange({target:{}})
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
