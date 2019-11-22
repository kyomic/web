<template>
	<td class="com-tablecolumn">
    <!-- 如果没配置$row，则显示为表头 -->
    <slot name="template" v-if="column && column.$row ">{{displayLabel}}</slot>
    <div v-else>
      {{label}}
      <div class="table-sort" v-if="column && column.sort">
        <i class="el-icon-caret-top" v-if="column && column.sort=='desc'" />
        <i class="el-icon-caret-bottom" v-else />
      </div>
      
    </div>
	</td>
</template>
<script>

let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import Devices from '@/lib/core/Devices';


export default {
  name: 'KTableColumn',
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