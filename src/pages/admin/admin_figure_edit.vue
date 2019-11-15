<template>
	<div class="page-wrap page-wrap-scroll page-admin admin_article_edit">
		<div class="wrapper">
			<el-form :label-position="mobile?'top':'left'" ref="form" :model="form" label-width="80px">
				<el-form-item label="名称">
					<el-input v-model="form.figure_name"></el-input>
				</el-form-item>
				<el-form-item label="中文名">
					<el-input v-model="form.figure_name_cn"></el-input>
				</el-form-item>
				<el-form-item label="系列">
					<el-input v-model="form.figure_series"></el-input>
				</el-form-item>
				<el-form-item label="厂商">
					<el-input v-model="form.figure_manufacturer"></el-input>
				</el-form-item>
				<el-form-item label="分类">
					<el-input v-model="form.figure_cate"></el-input>
				</el-form-item>
				<el-form-item label="价格">
					<el-input v-model="form.figure_price"></el-input>
				</el-form-item>
				<el-form-item label="发行日期">
					<el-input v-model="form.figure_release_date"></el-input>
				</el-form-item>
				<el-form-item label="简介">
					<el-input v-model="form.figure_intro" type="textarea"></el-input>
				</el-form-item>
				<el-form-item label="原型师">
					<el-input v-model="form.figure_sculptor"></el-input>
				</el-form-item>
				<el-form-item label="状态">
					<el-input v-model="form.status"></el-input>
				</el-form-item>
				<el-form-item label="页面来源">
					<el-input v-model="form.figure_refer" readonly></el-input>
				</el-form-item>
				<el-form-item label="缩略图">
					<div class="img-thumbs">
						<img :src=" host.www + '/'+form.figure_thumbs" v-if="form.figure_thumbs"></img>
						<el-button @click="onMakeThumbs">同步生成</el-button>
					</div>
				</el-form-item>
				<el-form-item label="产品图">
					<KSlider class="kslider" v-if="form.figure_imgs && form.figure_imgs.length">
						<div class="item" v-for="(item,index) in thumbs">
							<img :src=" host.www + '/'+item"></img>
						</div>
					</KSlider>
					<el-button @click="onUpdateOriginData">{{updating?'更新中...':'同步数据'}}</el-button>
				</el-form-item>
				<el-form-item label="　">
					<el-button type="primary" @click="onSubmit" :disabled="!dataReady">{{editMode?'保存修改':'立即创建'}}</el-button>
					<el-button @click="onCancel">取消</el-button>
				</el-form-item>
			</el-form>
		</div>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import KSlider from '@/components/KSlider'
import Quill from 'quill'
import Devices from '@/lib/core/Devices';

import { api } from '@/services/api';
let services = api.figure;

let admin_figure_edit = {
	name: 'admin_figure_edit',
	components:{KSlider},
	data(){
		return {
			loading:true,
			posting:false,
			updating:false,
			form: {
				figure_imgs:""
			}
		}
	},
	computed:{
		//环境状态
		...mapState('env', ['grid24code','router', 'host']),
		...mapGetters('env', ['mobile']),
		//用户状态
		...mapGetters('user',['isLogined', 'userinfo']),

		editMode(){
			if( this.$route.query && this.$route.query.id ){
				return true;
			}
			return false;
		},
		//视频缩略图
		thumbs(){
			if( this.form.figure_imgs ){
				return this.form.figure_imgs.split(",")
			}
			return [];
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

			services.update( {
				params:{id: this.$route.query.id },
				data:data
			}, this ).then( res =>{
				this.posting = true;
				this.$store.commit('admin_figure/update', data);
				this.$router.back();
			})
		},
		onMakeThumbs(){
			services.make_thumbs( {id: this.form.id }).then(res=>{
				this.form = {
					...this.form, ...res
				}
				this.$store.commit('admin_figure/update', this.form )
			})
		},
		/** 重新爬取单条数据 */
		async refactData( id ){
			let res = await services.update_figure({id});
			if( res ){
				return await services.info( {id });
			}else{
				throw new Error("处理失败");
			}
		},
		onUpdateOriginData(){
			this.updating = true;
			this.form = {
				...this.form, figure_imgs:""
			}
			this.refactData( this.form.id ).then(res=>{
				this.form = {
					...this.form, ...res
				}
				this.$store.commit('admin_figure/update', res);
				this.updating = false;
			}).catch(e=>{
				this.$network(e);
				this.updating = false;
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
			services.info( params, this ).then(res=>{
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


	.img-thumbs{
		width: 100*@rem;
		img{
			width:100%;
		}
	}
	.kslider .item{
	    height: 100px;
	    text-align: center;
	    img{
	    	display: inline-block;
	    	height: 100%;
	    }
	 }
</style>