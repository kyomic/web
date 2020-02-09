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
      //p2p
      //http://novage.com.ua/p2p-media-loader/demo.html
      let file = e.target;
      let files = file.files || [];
      if( files.length || true ){
        let stream = null;
        try{
           window.debughost = "https://cctv5alih5c.v.myalicdn.com/";
          window.debugstream = "https://cctv5alih5c.v.myalicdn.com/live/cdrmcctv5_1td.m3u8";

          window.debugstream = "https://wowza.peer5.com/live/smil:bbb_abr.smil/chunklist_b591000.m3u8"
          //window.debughost = /(https?:\/\/[^\/]+)/.exec(window.debugstream)[1] + "/";
          //let stream = new BufferStream( new FileReferenceProvider( { files:files } ) )
          stream = new HLStream({url:"http://web.fun.tv/demo/playlist_v-0144p-0100k-libx264.m3u8"})

          stream = new HLStream({url:window.debugstream})
          stream = new HLStream({url:"https://haoa.haozuida.com/20200105/TV2gMlpD/index.m3u8",cross:false})

          stream = new HLStream({url:"http://cdn.lv.funshion.com/cdn.lv.funshion.com/livestream/3976873713cf1c979737c9defa7a31ac88437336.m3u8?codec=ts"})
          //let stream = new URLStream( {url: files[0] })
          //mutil video
          //stream = new HLStream( {url:"https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s-fmp4/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8"})
          //stream = new HLStream( {url: "https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8" })

          //stream = new HLStream( {url: "http://web.fun.tv/demo/test.m3u8" })
          //stream = new HLStream( {url: "http://web.fun.tv/demo/test2.m3u8" })
          //stream = new HLStream( {url: "http://web.fun.tv/demo/playlist_v-0144p-0100k-libx264.m3u8" })
        }catch(e){
          console.error(e)
        }
       

        
        stream = new URLStream({url:"https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_9b68ca7a2eb570f791113a0d1801e038.mp4"})
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

      document.querySelector(".container").style.cssText = "display:block"
    },2000)
       
    
  }
}

</script>
<style lang="less">  
  canvas1{
    width:400px;
    height: 300px;
  }
  .kwp-video video{
    width:100%;
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
