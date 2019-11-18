<template>
	<div class="page-wrap page-wrap-scroll page-admin admin_article_edit">
		<div class="wrapper">
			<el-form :label-position="mobile?'top':'left'" ref="form" :model="form" label-width="80px">
			  <el-form-item label="标题">
				<el-input v-model="form.log_Title"></el-input>
			  </el-form-item>
			  <el-form-item label="分类">
				<el-select v-model="form.log_CateID" placeholder="文章分类">
				  <el-option label="区域一" value="shanghai"></el-option>
				  <el-option label="区域二" value="beijing"></el-option>
				</el-select>
			  </el-form-item>
			  <el-form-item label="发布日期">
				<el-col :span="11">
				  <el-date-picker type="date" placeholder="选择日期" v-model="form.log_PostTime" style="width: 100%;"></el-date-picker>
				</el-col>
				<el-col class="line" :span="2">-</el-col>
				<el-col :span="11">
				  <el-time-picker placeholder="选择时间" v-model="form.date2" style="width: 100%;"></el-time-picker>
				</el-col>
			  </el-form-item>
			  <el-form-item label="标签">
			  	<el-tag
				  :key="tag"
				  v-for="tag in form.dynamicTags"
				  closable
				  :disable-transitions="false"
				  @close="handleClose(tag)">
				  {{tag}}
				</el-tag>
				<el-input
				  class="input-new-tag"
				  v-if="inputVisible"
				  v-model="inputValue"
				  ref="saveTagInput"
				  size="small"
				  @keyup.enter.native="handleInputConfirm"
				  @blur="handleInputConfirm"
				></el-input>
				<el-button v-else class="button-new-tag" size="small" @click="showInput">+ New Tag</el-button>
			  </el-form-item>
			</el-form>
			<div class="editor-wrapper">
				<div id="editor" ref="editor">
					<!-- html code -->
				</div>
			</div>
			<el-form :label-position="mobile?'top':'left'" :model="formBottom" label-width="80px">
			  <el-form-item label="是否发布">
				<el-switch v-model="form.delivery"></el-switch>
			  </el-form-item>
			  <el-form-item label="是否公开">
				<el-switch v-model="form.log_IsShow"></el-switch>
			  </el-form-item>
			</el-form>
		</div>
		<div class="form-bottom-option">
			<div class="wrap">
				<el-button size="small" type="primary" @click="onSubmit" :disabled="!dataReady">{{editMode?'保存修改':'立即创建'}}</el-button>
				<el-button size="small" @click="onCancel">取消</el-button>
			</div>
		</div>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import Quill from 'quill'
import { api } from '@/services/api'
let {upload} = api.common;

import Devices from '@/lib/core/Devices';

import '@/lib/extends/quill/1.3.6/quill.snow.css';
import '@/lib/extends/highlightjs/9.12.0/styles/monokai-sublime.min.css';
//import hljs from 'highlight.js';
import hljs from "@/lib/extends/highlightjs/9.12.0/highlight"

let blog = api.blog;

let admin_article_edit = {
	name: 'admin_article_edit',
	components:{},
	data(){
		return {
			loading:true,
			posting:false,
			inputVisible:false,
			inputValue: '',
			form: {
				log_IsShow:0,
				name: '',
				region: '',
				date1: '',
				date2: '',
				delivery: false,
				open:false,
				type: [],
				resource: '',
				desc: '',
				dynamicTags:[1,2,3]
			},
			formBottom:{

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
			const toolbarOptions = [
			  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
			  ['blockquote', 'code-block'],
			 
			  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
			  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
			  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
			  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
			  [{ 'direction': 'rtl' }],                         // text direction
			 
			  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
			  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
			 
			  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
			  [{ 'font': [] }],
			  [{ 'align': [] }],
			  ['link','image','video','formula'],
			 
			  ['clean']                                         // remove formatting button
			];
			const toolbarSimple =[
				['bold', 'italic', 'underline',{ 'color': [] }],        // toggled buttons
				['blockquote', 'code-block', 'link','image','video'],
				['sep'],
				[{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'list': 'ordered'}, { 'list': 'bullet' }],

				[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent

				
				[{ 'align': [] }],
			  //不管用
			  //['clean']       
			]
			const quill = new Quill('#editor', {
				modules: {
					syntax: {
						highlight:hljs.highlight
					},
					toolbar: toolbarSimple
				},
				theme: 'snow',
				
			})

			quill.on('text-change',(delta, oldDelta, source)=>{
				if( source == 'user'){
					let index = 0;
					let ops = delta.ops;
					if( ops.length && ops.length > 1){
						index = ops[0].retain;
					}
					let findInsert = ops.find((res=>{
						return typeof res.insert != 'undefined'
					}))
					if( findInsert ){
						let base64 = findInsert.insert.image;
						if( base64 ){
							this.uploadImage({base64}).then(res=>{
								quill.insertEmbed(index, 'image', res.url);
								//删除本地图片
								quill.deleteText(index+1,1)
							}).catch(e=>{
								this.$message({
						          message: '图片上传出错,点击图片重试上传',
						          type: 'warning'
						        });
							})	
							
						}
					}
				}
				
			})

			let editor = this.$refs.editor;
			Devices.getInstance().delegate(editor,'img','click', (e)=>{
				let img = e.target;
				if( img && /^data/ig.exec( img.src )){
					this.uploadImage({base64:img.src}).then(res=>{
						img.setAttribute('src', res.url );
					}).catch(e=>{
						this.$message({
				          message: '图片上传出错,点击图片重试上传',
				          type: 'warning'
				        });
					})				
				}
				console.log(img)
			})
			this.quill = quill
			let code = this.form.log_Content||"";
			let dom = this.$refs.editor.querySelector(".ql-editor");
			dom.innerHTML = code;
			this.quill.update();
			//console.log(this.$refs.editor.querySelector(".ql-editor").innerHTML)
		},	
		onSubmit:function(){
			let data = {
				...this.form, ...this.formBottom, log_Content:this.$refs.editor.querySelector(".ql-editor").innerHTML
			}
			//delete data["id"];
			console.log("提交数据",data );
			blog.update( {data}, this ).then( res =>{
				this.$store.commit('admin_article/update', res);
			})
		},
		onCancel:function(){
			this.$router.back()
		},
		handleClose(tag) {
			this.form.dynamicTags.splice(this.form.dynamicTags.indexOf(tag), 1);
		},

		showInput() {
			this.inputVisible = true;
			this.$nextTick(_ => {
				this.$refs.saveTagInput.$refs.input.focus();
			});
		},
		handleInputConfirm:function(){
			let inputValue = this.inputValue;
	        if (inputValue) {
	          this.form.dynamicTags.push(inputValue);
	        }
	        this.inputVisible = false;
	        this.inputValue = '';
		},
		async uploadImage( data ){
			let res = await upload({
				data:data
			});
			return res;
		}
	},
	mounted(){
		let params = this.$route.query;
		if( params && params.id ){
			blog.info( params, this ).then(res=>{
				this.form = res;
				this.initQuill()
			})
		}else{
			this.initQuill();
		}
		
	}
}
export {admin_article_edit};
export default admin_article_edit;
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