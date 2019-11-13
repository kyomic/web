<template>
	<div class="page-wrap page-wrap-scroll page-admin admin_article_edit">
		<div class="wrapper">
			<el-form :label-position="mobile?'top':'left'" ref="form" :model="form" label-width="80px">
			  <el-form-item label="名称">
				<el-input v-model="form.name"></el-input>
			  </el-form-item>
			  <el-form-item label="分类">
				<el-select v-model="form.type" placeholder="任务分类">
				  <el-option label="figure" value="figure"></el-option>
				</el-select>				
			  </el-form-item>
			  <el-form-item label="网址">
				<el-input v-model="form.url"></el-input>
			  </el-form-item>
			  <el-form-item label="页面模板">
				<el-input v-model="form.tpl_page_url"  type="textarea"></el-input>
			  </el-form-item>
				<el-form-item>
					<el-button type="primary" @click="onSubmit" :disabled="!dataReady">{{editMode?'保存修改':'立即创建'}}</el-button>
					<el-button @click="onCancel">取消</el-button>
				  </el-form-item>
			</el-form>
		</div>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Quill from 'quill'
import Devices from '@/lib/core/Devices';

import { api } from '@/services/api';
let task = api.task;

let admin_figure_edit = {
	name: 'admin_figure_edit',
	components:{},
	data(){
		return {
			loading:true,
			posting:false,
			form: {
			}
		}
	},
	computed:{
		//环境状态
		...mapState('env', ['grid24code','router']),
		...mapGetters('env', ['mobile']),
		//用户状态
		...mapGetters('user',['isLogined', 'userinfo']),

		editMode(){
			if( this.$route.query && this.$route.query.id ){
				return true;
			}
			return false;
		},
		dataReady(){
			if( this.posting ){
				return false;
			}
			if( !this.editMode ){
				return true;
			}
			return this.form && typeof this.form.id !='undefined';			
		}
	},
	methods:{
		onSubmit:function(){
			this.posting = true;
			let data = {
				...this.form
			}

			task.update( {
				params:{id: this.$route.query.id },
				data:data
			}, this ).then( res =>{
				this.posting = true;
				this.$store.commit('admin_task/update', data);
				this.$router.back();
			})
		},
		onError(){
			this.posting = false
		},
		onCancel:function(){
			this.$router.back()
		}	
	},
	mounted(){
		
		let params = this.$route.query;
		if( params && params.id ){
			task.info( params, this ).then(res=>{
				this.form = res;
				
			})
		}
		console.log(params)

	}
}
export {admin_figure_edit};
export default admin_figure_edit;
</script>
<style lang="less">
	.action{
		width: 100*@rem;
	}
	/** reset quill editor start **/
	.ql-toolbar.ql-snow{
		border:none;
		background:#F5F5F5;
	}
	.ql-container.ql-snow{
		border:none;
	}
	.ql-editor{
		border-bottom: 6px solid #F5F5F5;
		img[src^='data']{
			border:1px solid red;
		}
	}
	.el-tag{
		margin-right: 3*@rem;
	}
	/** reset quill editor end **/
	/** 分隔符*/
	.mobile{
		.ql-toolbar .ql-formats:nth-child(3){
			display: block;
			height: 1px;
			overflow: hidden;
		}
	}
	.mobile .el-form{
		padding: 10*@rem;
		.el-form-item{
			margin-bottom: 0;
			>label{
				padding-bottom: 0;
			}
		}
	}
</style>