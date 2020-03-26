<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer">
      <input type="file" @change="onChange($event)" />
    </div>
    <div class="list">
      <div class="epids">
        <div :class="epid_idx==key?'current':''" class="epid" v-for="(value,key,index) in epids" @click="play(value,key)">第{{key+1}}集</div>
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
import utils from '@/lib/core/utils'

import WebVideo from '@/lib/extends/player/WebVideo'
import StupidVideo from '@/lib/extends/player/StupidVideo';

import { HLStream, BufferStream,URLStream } from '@/lib/extends/player/core/stream';
import { FileReferenceProvider } from '@/lib/extends/player/data'
let mountedId = 0;
let player = null;
export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
      temp:{
        value1:['龙须面','北京烤鸭']
      },
      options: [{
          value: '选项1',
          label: '黄金糕'
        }, {
          value: '选项2',
          label: '双皮奶'
        }, {
          value: '选项3',
          label: '蚵仔煎'
        }, {
          value: '选项4',
          label: '龙须面'
        }, {
          value: '选项5',
          label: '北京烤鸭'
        }],
        value1: [],
        value2: [],

      epid_idx:0,
      epids:[
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_9b68ca7a2eb570f791113a0d1801e038.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_7c9791ceb66af9af203d135c1a411af0.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_3c3f052a1279bad9f7c0af12b5124f1c.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_b1d07f7ba405daab62213af0563ceef4.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_716a44168e6c85e2948f624031d05a4a.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_fdff4ba008a4bb7ac14a9fc43ec288e1.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_390e31acd0175e10968ffa619d34d18a.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_9c9deefe4a38302a303568a99074d142.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_6738bbba7aec5ebef554f84e679db2a8.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_32d041caa1e26169148fd2d44d4bddf2.mp4",
        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_17299d79ed705cbfab9ed4b29f51ee34.mp4",

        "https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_05e0e8a95e84a65f351192f9004668e0.mp4"


      ],
      epids:[]
    };
  },

  computed:{
    
  },
  watch:{
    rgb:{
      
    }
  },
  methods:{
    onClick(){
      console.log('click')
      this.temp.value1 = ['龙须面','北京烤鸭','黄金糕','双皮奶']
      console.log(this)
    },
    play(url,idx){
      var dom = document.querySelector(".imglayer")
      dom.innerHTML = "";
      player= new WebVideo({target: dom}) 

      let stream = new URLStream({url})
      player.attachStream( stream );
      player.play();
      this.epid_idx = idx;
    },
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
          //stream = new HLStream( {url: "http://web.fun.tv/demo/flv.m3u8" })
          //stream = new HLStream( {url: "http://web.fun.tv/demo/playlist_v-0144p-0100k-libx264.m3u8" })
        }catch(e){
          console.error(e)
        }
        stream = new HLStream( {url: "http://web.fun.tv/demo/tt.m3u8" })
        //stream = new HLStream( {url: "http://test.fun.tv/flv.m3u8" })
        stream = new BufferStream( {url: "http://test.fun.tv/test.flv" } )
        //stream = new URLStream({url:"https://gss3.baidu.com/6LZ0ej3k1Qd3ote6lo7D0j9wehsv/tieba-smallvideo/60_9b68ca7a2eb570f791113a0d1801e038.mp4"})
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
      player= new StupidVideo({target: dom})    
      

      //player = new WebVideo({target:dom});
      //this.onChange({target:{}})

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
  .epid{
    display:inline-block;
    border:1px solid black;
    padding:10px;
  }
  .current{
    color: red;
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
