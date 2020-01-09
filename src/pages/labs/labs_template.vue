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
  
</style>
