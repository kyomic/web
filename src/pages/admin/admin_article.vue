<template>
	<div class="page-wrap page-admin admin_article>">
		<div class="wrapper" ref="wrapper">
			<KTable :data="tableData" :loading="loading" :mobile="mobile" v-slot:default="scope" @scroll.native="onWrapperScroll">
				<KTableColumn label="标题" prop="log_Title" :column="scope"></KTableColumn>
				<KTableColumn label="日期" prop="log_PostTime" :column="scope"></KTableColumn>
				<KTableColumn label="其它" prop="other" :column="scope" class="hidden-xs-only"></KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">编辑</el-button>
			        	<el-button size="mini" @click.native="onViewHandler(scope)">详情</el-button>
			        </template>
				</KTableColumn>
			</KTable>
		</div>
		<div class="form-bottom-option">
			<div class="wrap">
				<el-button size="small" type="primary" @click="onSubmit">发布文章</el-button>
			</div>
		</div>
	</div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';
import ScrollView from '@/components/ScrollView'

import { api } from '@/services/api';
let blog = api.admin_article;
let {upload} = api.common;

let admin_article = {
	name: 'admin_article',
	components:{KTable,KTableColumn, ScrollView},
	data(){
		return {
			loading:true,
			tableColumns:[1,2,3]
		}
	},
	computed:{
	  	//环境状态
	  	...mapState('admin_article',['list','scrollTop','currentPage']),
	    ...mapState('env', ['grid24code','router']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),


	    tableData(){
	    	return this.list.data || [];
	    }
	},
	methods:{
		...mapActions('admin_article',['nextPage']),
		...mapMutations('admin_article',['updateScroll']),

		onEditHandler:function( row ){
			this.$router.push({
				path:"/admin/article_edit", query:{'id': row.id }
			})
		},
		onViewHandler:function( row ){
			this.$router.push({
				path:"/admin/article_detail", query:{'id': row.id }
			})
		},

		onSlotProps:function(){
			console.log("得到子组件属性", arguments)
			return arguments[0]
		},
		onSubmit(){
			this.$router.push({
				path:"/admin/article_edit", query:{}
			})
		},
		onScroll(e){},
		onReachBottom(e){
			this.loading = true;
			this.nextPage();
		},
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
				setTimeout(_=>{
					this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
				},2000)
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


		//this.$layoutTable();
	}
}
export {admin_article};
export default admin_article;
</script>
<style lang="less">
	.action{
		width: 100*@rem;
	}
	.mod-table{
		thead td:last-child{
			width:85*@rem;
		};
	}
</style>