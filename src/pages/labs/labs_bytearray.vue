<template>
  <div class="wrapper">
    <div class="imglayer" ref="imglayer">
      <p>
        Flash中的ByteArray对象，可以看成是一段内存，而该对象的endian属性决定着将外部数据写入内存的字节序。

以写整形为例，如果ByteArray对象的endian设置为默认的bigEndian，即大端，那么在写入一个4字节的整型时，它将会先把数据的最高有效位写入到最低端，最后，数据的最低有效位会被写入最高端。

所谓最高端与最低端在ByteArray对象中可以用它的position属性来表示，position大的字节就是大端的字节。

而最低和最高有效位是对于数据而言的。
<img src="http://www.shareme.cn/assets/labs/bytearray_endian.jpg" width="100%" />
</p>

      <p>以下是JS版的ByteArray实现</p>
      <div class="code">
        <pre class='hljs'><code class='javascript'>
var len = 0x01020304;
var id = 0xFF000000;
var uid = 0xFF;

var head = new ByteArray();
head.writeUnsignedInt(len);
head.writeUnsignedInt(id);
head.writeUnsignedInt(uid);

//console.log(head.bytes)
//结果:
//{{this.BIG_ENDIAN}}
var head = new ByteArray();
head.endian = Endian.LITTLE_ENDIAN;
head.writeUnsignedInt(len);
head.writeUnsignedInt(id);
head.writeUnsignedInt(uid);
//console.log(head.bytes)
//结果:
//{{this.LITTLE_ENDIAN}}
        </code></pre>
      </div>
      
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

import KYO from '@/lib/extends/img/KYO';
import ByteArray from '@/lib/extends/img/ByteArray';
import Endian from '@/lib/extends/img/const/Endian'



import utils from '@/lib/core/utils'


export default {
  name: 'HelloWorld2',
  title:"JS版的ByteArray实现",
  components:{},
  data() {
    return {
     BIG_ENDIAN:[],
     LITTLE_ENDIAN:[]
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
    var len = 0x01020304;
    var id  = 0xFF000000;
    var uid = 0xFF;
    
    var head = new ByteArray();
    //head.endian = Endian.LITTLE_ENDIAN;
    head.writeUnsignedInt(len);
    head.writeUnsignedInt(id);
    head.writeUnsignedInt(uid);
    this.BIG_ENDIAN = head.bytes.join(",")
    var head = new ByteArray();
    head.endian = Endian.LITTLE_ENDIAN;
    head.writeUnsignedInt(len);
    head.writeUnsignedInt(id);
    head.writeUnsignedInt(uid);

    this.LITTLE_ENDIAN = head.bytes.join(",")
    setTimeout(_=>{
      this.$highlight( this.$el, ".code" );
    },100)
    this._isMounted = true
    console.log("mounted", this);
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

  .mobile .controls{
    width: 150*@rem;
  }
</style>
