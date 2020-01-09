<template>
  <div class="wrapper">
    <h3>A(下面)+B(上面)+C(结果)</h3>
    <div class="imglayer" ref="imglayer"></div>

    <div class="controls">
      <el-select size="mini" v-model="value" placeholder="请选择混合模式" @change="onChange">
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

import { ColorBlender } from '@/lib/extends/img/ColorBlender';
import { BitmapDataFilter } from '@/lib/extends/img/BitmapDataFilter'
import { BitmapFilter, BitmapFilterDescription } from '@/lib/extends/img/BitmapFilter';



export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
      value:"",
      options: [{
        label: '基础形',
        options: [{
          value: 'NORMAL',
          label: '正常'
        }, {
          value: 'DISSOLVE',
          label: '溶解'
        }]
      }, 
      {
        label: '城市名',
        options: [{
          value: 'DARKEN',
          label: '变暗'
        }, {
          value: 'MUTIPLY',
          label: '正片叠底'
        }, {
          value: 'COLOR_BURN',
          label: '颜色加深'
        }, {
          value: 'LINEAR_BURN',
          label: '线性加深'
        }, {
          value: 'DARKER_COLOR',
          label: '深色'
        }]
      }, 
      {
        label: '提亮型',
        options: [{
          value: 'LIGHTEN',
          label: '变亮'
        }, {
          value: 'SCREEN',
          label: '滤色'
        }, {
          value: 'COLOR_DODGE',
          label: '颜色减淡'
        }, {
          value: 'LINEAR_DODGE',
          label: '线性减淡'
        }, {
          value: 'LIGHTER_COLOR',
          label: '浅色'
        }, {
          value: 'OVERLAY',
          label: '叠加'
        }, {
          value: 'SOFT_LIGHT',
          label: '柔光'
        }, {
          value: 'HARD_LIGHT',
          label: '强光'
        }, {
          value: 'VIVID_LIGHT',
          label: '亮光'
        }, {
          value: 'LINEAR_LIGHT',
          label: '线性光'
        }, {
          value: 'PIN_LIGHT',
          label: '点光'
        }, {
          value: 'HARD_MIX',
          label: '实色混合'
        }]
      }, 
      {
        label: '异色',
        options: [{
          value: 'DIFFERENCE',
          label: '差值'
        }, {
          value: 'EXCLUSION',
          label: '排除'
        }, {
          value: 'SUBSTRACT',
          label: '减去'
        }, {
          value: 'DIVIDE',
          label: '划分'
        }]
      }, 
      {
        label: '蒙色',
        options: [{
          value: 'HUE',
          label: '色相'
        }, {
          value: 'SATURATION',
          label: '保和度'
        }, {
          value: 'COLOR',
          label: '颜色'
        }, {
          value: 'LUMINOSITY',
          label: '明度'
        }]
      }]
    }
  },


  methods:{
    async run(){
      let img = new KImage(); 
      await img.load("http://www.shareme.cn/assets/labs/Hydrangeas.jpg")       
      this.$refs["imglayer"].appendChild( img.canvas );
      let img2 = new KImage();
      await img2.load("http://www.shareme.cn/assets/labs/Jellyfish.jpg");
      this.$refs["imglayer"].appendChild( img2.canvas );

      let img3 = new KImage();
      this.$refs["imglayer"].appendChild( img3.canvas );
      window.__source = img;
      window.__target = img2
      window.__image = img3;
    },
    onChange(data){
      console.log("ColorBlender", data)
      this.value = data;
      let method = ColorBlender[data];

      let filter = new BitmapFilter( BitmapDataFilter.blender,{
        method,
        bitmap: window.__target.bitmap
      });
      window.__source.clearFilter();
      let newbitmap = filter.render( window.__source.bitmap )
      console.log("newdata",newbitmap)
      window.__image.putImageData( newbitmap )
    }
  },
  mounted(){    
    this.run();
  }
}

</script>
<style lang="less">
  .imglayer canvas{
    width:200px;
    height: 150px;
    border: 1px solid #ccc;
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
    width: 120*@rem;
  }



</style>
