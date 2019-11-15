<template>
	<div class="page-wrap-content admin_article>">
		<KTable :mobile="mobile" :data="tableData" :pagination="list.pagination" :loading="false" v-slot:default="scope" @scroll.native="onWrapperScroll" @current-change="onPageChange" ref="mod-table">
			<KTableColumn label="ID" prop="figure_id" :column="scope" @click.native="onClick(scope)"></KTableColumn>
			<KTableColumn label="缩略图" :column="scope">
				<template v-slot:template>
					<img :src=" host.www + '/'+scope.figure_thumbs" v-if="scope.figure_thumbs" />
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
		<i v-if="hasLoading" class="el-icon-loading loading"></i>
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
	    ...mapState('env', ['grid24code','router','host']),
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
		onScroll(e){},
		onReachBottom(e){
			this.loading = true;
			this.nextPage();
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
	beforeDestroy(){
		if( this.onScrollHandler ){
			this.$root.$off('scroll',this.onScrollHandler )
			this.onScrollHandler = null;
		}
		if( this.onReachBottomHandler ){
			this.$root.$off('reachbottom',this.onReachBottomHandler )
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
			//this.$el.querySelector(".mod-table").scrollTop = this.scrollTop;
		}
		this.$root.$onScroll = this.onScroll;
		this.$root.$onScrollBottom = this.onReachBottom;
		this.onScrollHandler = this.onScroll.bind(this);
		this.onReachBottomHandler = this.onReachBottom.bind(this);
		this.$root.$on('scroll',this.onScrollHandler )
		this.$root.$on('reachbottom',this.onReachBottomHandler )


		this.$layoutTable();
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
		thead td:first-child{
			width:20*@rem;
		};
		thead td:last-child{
			width:45*@rem;
		};
	}
</style>