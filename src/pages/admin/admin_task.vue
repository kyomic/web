<template>
	<div class="page-wrap page-admin admin_article>">
		<div class="wrapper" ref="wrapper">
			<div class="mod-table-header" ref="mod-table-header">
				<el-button @click.native="onAddHandler">添加</el-button>
			</div>
			<KTable :mobile="mobile" :data="tableData" :pagination="list.pagination" :loading="hasLoading" v-slot:default="scope" @scroll.native="onWrapperScroll" @current-change="onPageChange" ref="mod-table">
				<KTableColumn label="名称" prop="name" :column="scope"></KTableColumn>
				<KTableColumn label="类型" prop="type" :column="scope"></KTableColumn>
				<KTableColumn label="进度"  :column="scope">
					<template v-slot:template>
						<el-progress :text-inside="true" :stroke-width="20" :percentage="scope.total?((Number(scope.loadindex)+1)/Number(scope.total)*100).toFixed(2):0"></el-progress>
					</template>
				</KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">修改</el-button>
			        	<el-button size="mini" @click.native="onExecHandler(scope)" :type="scope.status==4?'danger':''">
			        	{{ scope.status==2?'暂停':'执行'}}
			        	</el-button>
			        	<el-button size="mini" @click.native="onExecHandler(scope,'reset')" :type="scope.status==4?'danger':''">
			        	{{ scope.status==2?'暂停':'重置'}}
			        	</el-button>
			        </template>
				</KTableColumn>

				
			</KTable>
		</div>
		
	</div>
</template>

<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';

import { task } from '@/services/api';

let admin_task = {
	name: 'admin_task',
	components:{KTable,KTableColumn},
	data(){
		return {
			loading:true,
			tableColumns:[1,2,3]
		}
	},
	computed:{
	  	//环境状态
	  	...mapState('admin_task',['list','scrollTop','currentPage']),
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
		...mapActions('admin_task',['nextPage','setPage', 'stopall', 'start', 'stop']),
		...mapMutations('admin_task',['updateScroll']),

		onAddHandler(row){
			this.$router.push({
				path:"/admin/task_edit"
			})
		},
		onEditHandler:function( row ){
			this.$router.push({
				path:"/admin/task_edit", query:{'id': row.id }
			})
		},
		onExecHandler:function( row, type ){
			let reset = type =='reset' ? 1:0
			if( row.status == 2 ){
				this.stop({id:row.id});
			}else{
				this.start({id:row.id,reset});
			}
			
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
export {admin_task};
export default admin_task;
</script>
<style lang="less" scoped>
	.action{
		width: 100*@rem;
	}
	.mod-table{
		thead td:last-child{
			width:125*@rem;
		};
	}
</style>