<template>
	<div class="mod-table">
		<div class="com-table-wrapper">
      <div class="table-fixed">
        <table cellspacing="0" cellpadding="0" border="0">
            <thead>
              <tr class="show">
                <slot></slot>            
              </tr>
            </thead>
        </table>
      </div>
			<table cellspacing="0" cellpadding="0" border="0" ref="table">
				<thead>
					<tr>
						<slot></slot>            
					</tr>
				</thead>
				<tr v-for="item in tableData" v-bind:key="item.id">
					<slot v-slot:template v-bind="item"></slot>
				</tr>
			</table>
			<div class="com-loading" v-if="loading">
				<i class="el-icon-loading"></i>
			</div>
      <!-- <div class="empty" v-if="!loading">没有更多数据了 ~ </div> -->
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
import KTableColumn from '@/components/KTableColumn'
import dom from '@/lib/core/dom';
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

  updated(){
    let tr = this.$refs.table.querySelectorAll("tr");
    tr = Array.from(tr);
    tr.map((res,i)=>{
      if( !dom.hasClass(res,'show')){
        setTimeout(_=>{
          dom.addClass(res,'show');
        },100*(i % 10))
      }
    })
  },
  mounted(){
  }
};
</script>
<style lang="less" scoped>
  .mod-table{
    .transition(all);
  }
	.table-fixed{
    position: fixed;
    background: white;
    width: 100%;
    z-index: 5;/*td中有些元素是absolute*/
  }
  .empty{
    padding:30*@rem;
    text-align: center;
    color: #666;
  }
	
</style>