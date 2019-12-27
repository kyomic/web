<template>
  <div class="wrapper">
    <h3>A(上面)+B(下面)+C(结果)</h3>
    <div class="imglayer" ref="imglayer"></div>

    <div class="controls">
      <el-select v-model="value" placeholder="请选择混合模式">
        <el-option-group
          v-for="group in options"
          :key="group.label"
          :label="group.label">
          <el-option
            v-for="item in group.options"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-option-group>
      </el-select>
    </div>    
  </div>


</template>

<script>
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
  components:{},
  data() {
    return {
      options: [{
        label: '热门城市',
        options: [{
          value: 'Shanghai',
          label: '上海'
        }, {
          value: 'Beijing',
          label: '北京'
        }]
      }, 
      {
        label: '城市名',
        options: [{
          value: 'Chengdu',
          label: '成都'
        }, {
          value: 'Shenzhen',
          label: '深圳'
        }, {
          value: 'Guangzhou',
          label: '广州'
        }, {
          value: 'Dalian',
          label: '大连'
        }]
      }]
    }
  },
  methods:{
    
  },
  mounted(){    
    let img = new KImage();
    img.load("http://www.shareme.cn/assets/labs/Hydrangeas.jpg").then(res=>{
      this.$refs["imglayer"].appendChild( img.canvas );
    })
    let img2 = new KImage();
    img2.load("http://www.shareme.cn/assets/labs/Jellyfish.jpg").then(res=>{
      this.$refs["imglayer"].appendChild( img2.canvas );
    })
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
  .el-collapse-item {
    background: red;
  }
  .controls{
    width: 200*@rem;
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
