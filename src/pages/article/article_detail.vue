<template>
	<div class="page-wrap-content">
		<div class="com-loading"><i v-if="loading" class="el-icon-loading loading"></i></div>
		<div class="article-item" v-show="!loading">
			<div class="article-header">
				<h2 class="title">
					{{item.log_Title}}
					<router-link v-if="isAdmin" :to="'/admin/article_edit/?id=' + item.id">
						<i class="i-edit el-icon-edit"></i>
					</router-link>
					
				</h2>
				<div class="meta">					
					<div>
						<span class="meta-author">作者:{{item.log_Author||'admin'}}</span>
						<span class="meta-author">日期:{{item.log_PostTime}}</span>
						<span class="meta-from">
							来源:<a :href="/shareme.cn/.exec(item.log_FromUrl)?'#':item.log_FromUrl" target="_blank" >{{item.log_From||'本站原创'}}</a>
						</span>
					</div>
				</div>
			</div>
            <div class="article-content">
            	<div class="content" v-html="item.log_Content" @click="onClickBlog(item, $event)">
            		{{item.log_Content}}
            	</div>
            	<span class="end-tag">完~</span>
            </div>
            <div class="meta">
				<div>
					<span class="meta-from">
					</span>
					<span class="meta-tag" v-if="tags && tags.length">标签:
						<em v-for="(item) in tags">
							<router-link :to="'/?tag='+ item.tag_id">
								{{item.tag_name}}
							</router-link>
						</em>
					</span>
				</div>
			</div>
            <div class="article-footer">
            	<div class="pager">
            		<router-link v-if="item.prev" :to="'/article/detail?id=' + item.prev.id">
						上一篇: {{item.prev.log_Title}}
					</router-link>
					<router-link v-if="item.next" :to="'/article/detail?id=' + item.next.id">
						下一篇: {{item.next.log_Title}}
					</router-link>
            	</div>
            </div>
            <KComment :id="item.id"></KComment>
		</div>

		<KViewer :images="previewImgs" :show="showviewer" @hide="onHideViewer">
	    </KViewer>
	</div>	
	
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')

import utils from '@/lib/core/utils'
import KViewer from '@/components/KViewer'
import KComment from '@/components/KComment'

let Quill = require('quill')
import '@/lib/extends/quill/1.3.6/quill.snow.css';
import '@/lib/extends/highlightjs/9.12.0/styles/monokai-sublime.min.css';
//import hljs from "@/lib/extends/highlightjs/9.12.0/highlight"
let hljs = require("highlight.js");
import "./article.less"
export default {
	name: 'Article',
	components:{KViewer,KComment},
	data() {
		return {
			article_id:0,
			comment:"",
			showviewer:false,
			previewImgs:[],

			showCommentBox:false
		};
	},
	computed:{
		...mapState('env', ["router"]),
		...mapState('blog',['loading','detail']),
		...mapGetters('blogsite',['siteinfo']),
		...mapGetters('user', ['isLogined','isAdmin']),

		tags(){
			debug && console.log("站点信息", this.siteinfo)
			let site_tags = this.siteinfo ? (this.siteinfo.tags||{}) : null;
			let tag = this.detail.log_tag || '';
			let match_tags = [];
			let matches = /\{(\d+)\}/ig;
			while( true ){
				let res = matches.exec( tag );
				if( res && res.length>1 ){
					match_tags.push( res[1] )
				}else{
					break;
				}
			}
			if( match_tags.length ){
				tag = match_tags.join(',');
			}
			tag = tag.split(",").map(res=>{
				let a = site_tags[ res ]||"";
				return a;
			})
			tag = tag.filter(res=>{
				return res!="";
			})
			return tag
		},
		item(){
			return this.detail
		}
	},
	methods:{
		...mapActions("blog", ["info"]),

		onClickBlog(data, e){
			let target = e.target;
			debug && console.log(target, data)
			if( target && target.nodeName.toLowerCase() == 'img'){
				let imgs = data.log_Content;
				this.$preview( imgs );
			}
		},
		onHideViewer(){
			this.previewImgs = [];
			this.showviewer = false;
		},
		onComment:function(){
			if( !this.isLogined ){
				this.$router.push({path: '/account/login', query: {'ref': this.router.current.fullPath}})
			}else{
				this.showCommentBox = true;
			}
			
		}, 
		onMounted(){
			let id = this.$route.query.id;			
			this.article_id = id;
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
			this.info({id:id}).then(res=>{
				if( !res){
					this.$router.replace({path: '/404', query: {'type':'article'}})
					return;
				}
				//this.$updateTitle( res.log_Title );
				this.$highlight( this.$el );
			})
		}
	},
	watch: {
	    // 如果路由有变化，会再次执行该方法
	    '$route':function(data){
	    	this.onMounted();
	    }
	},
	mounted(){
		this.onMounted();
		this.$animate();
	}
};
</script>
<style scoped>
	.i-edit{
		color:#409EFF;
	}

</style>