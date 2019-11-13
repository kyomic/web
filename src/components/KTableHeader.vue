<template>
  <div>
    <slot name="header">header</slot>
  </div>
</template>
<script>

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Devices from '@/lib/core/Devices';


export default {
  name: 'KTableHeader',
  data() {
    return {
    };
  },
  props:{
    loading:{
      type:Boolean,default:false, required:false
    },
    label:{
      type:String, default:"", required:false
    },
    /** 表格单元格的字段名 */
    prop: {
      type: String
    },
    column:null
  },
  computed:{
    /** 显示的模板 **/
    displayLabel(){
      if( this.column ){
        return this.column[ this.prop ] || '';
      }
      return this.label;
    }
  },
  methods:{
  },
  mounted(){
    /*this.$nextTick(()=>{
      console.log(this.$slots, this.$scopedSlots)
    })*/
  }
};
</script>
<style scoped>
</style>