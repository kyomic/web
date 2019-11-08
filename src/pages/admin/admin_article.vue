<template>
	<div class="page-wrap page-admin admin_article>">
		<div class="wrapper" ref="wrapper">
			<KTable :data="tableData" :loading="loading" v-slot:default="scope" @scroll.native="onWrapperScroll">
				<KTableColumn label="标题" prop="title" :column="scope"></KTableColumn>
				<KTableColumn label="日期" prop="date" :column="scope"></KTableColumn>
				<KTableColumn label="其它" prop="other" :column="scope" class="hidden-xs-only"></KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">Edit</el-button>
			        	<el-button size="mini" @click.native="onViewHandler(scope)">详情</el-button>
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
import ScrollView from '@/components/ScrollView'

import { upload } from '@/lib/api';
import { api } from '@/services/api';
let api_article = api.article;

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
	    ...mapState('env', ['grid24code','router']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),

	    ...mapGetters('admin_article',['list','scrollTop']),

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

		onWrapperScroll(e){
			let target = e.currentTarget;
			let height = target.offsetHeight;
			let scrollHeight = target.scrollHeight;

			this.updateScroll( target.scrollTop );
			if( target.scrollTop >=  scrollHeight - height ){
				this.nextPage();
			}
		},
		onSlotProps:function(){
			console.log("得到子组件属性", arguments)
			return arguments[0]
		}
	},
	mounted(){
		console.log("tableData", this.list)
		if( !this.tableData || !this.tableData.length ){
			this.nextPage();
		}else{
			this.$refs.wrapper.querySelector(".mod-table").scrollTop = this.scrollTop;			
		}
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
			width:80*@rem;
		};
	}
</style>