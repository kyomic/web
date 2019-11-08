<template>
	<div class="page-admin admin_article>">
		<KTable :data="tableData" :loading="loading" v-slot:default="scope">
			<KTableColumn label="标题" prop="title" :column="scope"></KTableColumn>
			<KTableColumn label="日期" prop="date" :column="scope"></KTableColumn>
			<KTableColumn label="其它" prop="other" :column="scope" class="hidden-xs-only"></KTableColumn>
			<KTableColumn label="操作" prop="action" :column="scope">
				<template v-slot:template>
		        	<el-button size="mini" @click.native="onEditHandler(scope)">Edit</el-button>
		        </template>
			</KTableColumn>
		</KTable>
	</div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';
let admin_article = {
	name: 'admin_article',
	components:{KTable,KTableColumn},
	data(){
		return {
			loading:true,
			tableData:[],
			tableColumns:[1,2,3]
		}
	},
	 computed:{
	  	//环境状态
	    ...mapState('env', ['grid24code','router']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),
	},
	methods:{
		onEditHandler:function(){
			console.log("click", arguments)
			this.$router.push({
				path:"/admin/article_edit", query:{'id':1}
			})
		},
		onSlotProps:function(){
			console.log("得到子组件属性", arguments)
			return arguments[0]
		}
	},
	mounted(){
		console.log("admin_article is loaded", this)
		setTimeout(()=>{
			this.tableData = [
				{
					title:"2",
					date:"2011-01-01",
					status:"1"
				},
				{
					title:"21",
					date:"2012-01-01",
					status:"10"
				}
			]
			this.loading = false;
		},100)
	}
}
export {admin_article};
export default admin_article;
</script>
<style lang="less">
	.action{
		width: 100*@rem;
	}
</style>