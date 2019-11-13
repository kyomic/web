<template>
	<div class="mod-table">
		<div class="com-table-wrapper">			
			<table cellspacing="0" cellpadding="0" border="0">
				<thead>
					<tr>
						<slot></slot>            
					</tr>
				</thead>
				<tr v-for="item in tableData">
					<slot v-slot:template v-bind="item"></slot>
				</tr>
			</table>
			<div class="com-loading" v-if="loading">
				<i class="el-icon-loading"></i>
			</div>
			<el-pagination
        background
        layout="prev, pager, next"
        :total="pagination.total" :page-size="pagination.pagesize"
        @current-change="onPageChange"
         v-if="!mobile">
      </el-pagination>
		</div>
	</div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Devices from '@/lib/core/Devices';
import KTableColumn from '@/components/KTableColumn'


export default {
  name: 'KTable',
  components:{KTableColumn},
  data() {
    return {
    };
  },
  props:{
  	loading:{
  		type:Boolean,default:true, required:false
  	},
    mobile:{
      type:Boolean,default:false, required:true
    },
    pagination:{
      type:Object, required:false,default:function(){
        return {
          total:1,pagesize:1
        }
      }
    },
  	data:{
  		type:Array,required:true, 
  		default:function(){
  			return []
  		},
  	}
  },
  computed:{
  	columnsLabels:function(){
  		if( this.data ){
  			let slots = [];
  			let labels = (this.$slots.default || []).map(res=>{
				let data = res.data;
				if( data ){
					slots.push( res.context.$scopedSlots);
					return data.attrs.prop;
				}
				return '';
			})
			labels = labels.filter(res=>res!='');
			return labels;
  		}
  	},
  	tableData:function(){
  		let data = (this.data || [])
  		return data.map( (res, i )=>{
  			res.$index = i;
  			res.$row = data;
  			return res;
  		});
  	}
  },
  methods:{
    onPageChange( page ){
      this.$emit('current-change', page);
    }
  },
  mounted(){
  	console.log("###################", this)
  }
};
</script>
<style lang="less">
	
	
</style>