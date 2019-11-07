<template>
	<div class="mod-table">
		<div class="com-table-wrapper">
			<i v-if="loading" class="el-icon-loading"></i>
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
  },
  mounted(){
  	console.log("###################", this)
  }
};
</script>
<style lang="less">
	.mod-table{
		height: 100%;
		width: 100%;
		overflow-x: hidden;
		overflow-y: scroll;
		position: absolute;
		table{
			table-layout: fixed;
			width: 100%;
		}
		td{
			border-bottom:1px solid #ebeef5;
		}
		
	}
	.mod-table{
		font-size: 12*@rem;
		td{
			padding: 10px 10px;
		}
	}
	
</style>