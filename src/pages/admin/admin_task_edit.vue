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

			  	<div class="editor-wrapper mod-editor">
					<div class="label">数据处理脚本</div>
					<div id="editor_processer" ref="editor_processer">
						<pre>{{form.code_processer}}</pre>
					</div>
				</div>
				<div class="editor-wrapper  mod-editor">
					<div class="label">HTML解析脚本</div>
					<div id="editor_parser" ref="editor_parser">
						<pre>{{form.code_parser}}</pre>
					</div>
				</div>
				<el-form-item>
					<el-button type="primary" @click="onSubmit" :disabled="!dataReady">{{editMode?'保存修改':'立即创建'}}</el-button>
					<el-button @click="onCancel">取消</el-button>
				  </el-form-item>
			</el-form>
		</div>
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import Quill from 'quill'
import Devices from '@/lib/core/Devices';

import '@/lib/extends/quill/1.3.6/quill.snow.css';
import '@/lib/extends/highlightjs/9.12.0/styles/monokai-sublime.min.css';
//import hljs from 'highlight.js';
import hljs from "@/lib/extends/highlightjs/9.12.0/highlight"

import { api } from '@/services/api';
let task = api.task;

let admin_task_edit = {
	name: 'admin_task_edit',
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
		initQuill () {
			hljs.configure({   // optionally configure hljs
			  languages: ['javascript', 'ruby', 'python']
			});			
			const toolbarSimple =[
				['blockquote', 'code-block'],
			]
			const quill = new Quill('#editor_processer', {
				modules: {
					syntax: {
						highlight:hljs.highlight
					},
					toolbar: toolbarSimple
				},
				theme: 'snow',
				
			})
			const quill_parser = new Quill('#editor_parser', {
				modules: {
					syntax: {
						highlight:hljs.highlight
					},
					toolbar: toolbarSimple
				},
				theme: 'snow',
				
			})
			quill.on('text-change',(delta, oldDelta, source)=>{
				let code = this.$refs.editor_processer.querySelector(".ql-editor").innerHTML;
				this.form.code_processer = code;
			})		
			quill_parser.on('text-change',(delta,oldDelta, source )=>{
				let code = this.$refs.editor_parser.querySelector(".ql-editor").innerHTML;
				this.form.code_parser = code;
			})
			//this.quill_parser.update();
		},
		updateQuill(){
			
		},
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
				this.$nextTick(_ => {
					let t0 = new Date().valueOf()
					this.initQuill()
					console.log("编辑渲染用时:",(new Date().valueOf()-t0))
				});
				
			})
		}
		console.log(params)

	}
}
export {admin_task_edit};
export default admin_task_edit;
</script>
<style lang="less" scoped>
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
	
	
</style>