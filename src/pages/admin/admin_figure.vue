<template>
	<div class="page-wrap page-admin admin_article>">
		<div class="wrapper" ref="wrapper">
			<KTable :mobile="mobile" :data="tableData" :pagination="list.pagination" :loading="hasLoading" v-slot:default="scope" @scroll.native="onWrapperScroll" @current-change="onPageChange" ref="mod-table">
				<KTableColumn label="缩略图" :column="scope">
					<template v-slot:template>
						<img :src="'http://php.tt.com/'+scope.figure_thumbs" v-if="scope.figure_thumbs" />
						<div v-else>empty</div>
					</template>
				</KTableColumn>
				<KTableColumn label="名称" prop="figure_name" :column="scope" @click.native="onClick(scope)"></KTableColumn>
				<KTableColumn label="状态"  :column="scope">
					<template v-slot:template>
						<div>
							{{scope.figure_release_date}}
							{{scope.figure_price.replace('日圓 +消費稅','円')}}
						</div>
					</template>
				</KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">修改</el-button>
			        </template>
				</KTableColumn>

				
			</KTable>
		</div>
		
	</div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';
import KTableHeader from '@/components/KTableHeader'

import { figure } from '@/services/api';

let admin_figure = {
	name: 'admin_figure',
	components:{KTable,KTableHeader,KTableColumn},
	data(){
		return {
			loading:true,
			tableColumns:[1,2,3]
		}
	},
	computed:{
	  	//环境状态
	  	...mapState('admin_figure',['list','scrollTop','currentPage']),
	    ...mapState('env', ['grid24code','router']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),

	    hasLoading(){
	    	if( !this.mobile ){
	    		//pc web
	    		if( this.list && this.list.pagination ){
	    			if( this.list.pagination.page == this.currentPage ){
	    				return false;
	    			}
	    		}
	    		return true;
	    	}
	    	if( this.list && this.list.pagination ){
	    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
	    			return false;
	    		}
	    	}
	    	return true;
	    },
	    tableData(){
	    	return this.list.data || [];
	    }
	},
	methods:{
		...mapActions('admin_figure',['nextPage','setPage', 'stopall', 'start', 'stop']),
		...mapMutations('admin_figure',['updateScroll']),

		onAddHandler(row){
			this.$router.push({
				path:"/admin/figure_edit"
			})
		},
		onEditHandler:function( row ){
			this.$router.push({
				path:"/admin/figure_edit", query:{'id': row.id }
			})
		},
		onExecHandler:function( row ){
			if( row.status == 2 ){
				this.stop({id:row.id});
			}else{
				this.start({id:row.id});
			}
			
		},
		onClick:function( row ){
			console.log('click', row)
		},
		onWrapperScroll(e){
			let target = e.currentTarget;
			let height = target.offsetHeight;
			let scrollHeight = target.scrollHeight;

			this.updateScroll( target.scrollTop );
			if( target.scrollTop >=  scrollHeight - height ){
				this.loading = true;
				this.nextPage();
			}
		},
		onPageChange(page){
			this.loading = true;
			this.setPage({page})
		},
		onSlotProps:function(){
			console.log("得到子组件属性", arguments)
			return arguments[0]
		}
	},
	mounted(){
		console.log("tableData", this.list)
		if( !this.tableData || !this.tableData.length ){
			this.nextPage().then(res=>{
				if( this.list && this.list.pagination ){
		    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
		    			this.loading = false;
		    		}
		    	}
			}).catch(e=>{
				this.$network(e);
			});
		}else{
			this.$el.querySelector(".mod-table").scrollTop = this.scrollTop;
		}

		this.$layoutTable();
	},
	beforeDestroy(){
		console.log("将要销毁")
	}
}
export {admin_figure};
export default admin_figure;
</script>
<style lang="less">
	.action{
		width: 100*@rem;
	}
	.mod-table{
		thead td:last-child{
			width:45*@rem;
		};
	}
</style>