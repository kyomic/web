<template>
	<div class="page-wrap-content">
		<i v-if="loading" class="el-icon-loading loading"></i>
		<div class="article-item" v-show="!loading">
			<div class="article-header">
				<h2 class="title">
					{{item.log_Title}}
				</h2>
				<div class="meta">
					<span class="meta-author">作者:{{item.log_Author}}</span>
					<span class="meta-author">日期:{{item.log_PostTime}}</span>
				</div>
			</div>
            <div class="article-content">
            	<div class="content" v-html="item.log_Content">
            		{{item.log_Content}}
            	</div>
            </div>
            <div class="article-footer">
            </div>
		</div>
	</div>	
	
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import "./article.less"
export default {
	name: 'Article',
	data() {
		return {
			comment:"",
			showCommentBox:false
		};
	},
	computed:{
		...mapState('env', ["router"]),
		...mapState('blog',['loading','detail']),
		...mapGetters('user', ['isLogined']),

		item(){
			return this.detail
		}
	},
	methods:{
		...mapActions("blog", ["info"]),
		onComment:function(){
			if( !this.isLogined ){
				this.$router.push({path: '/account/login', query: {'ref': this.router.current.fullPath}})
			}else{
				this.showCommentBox = true;
			}
			
		}
	},
	mounted(){
		let id = this.$route.query.id;
		this.info({id:id}).then(res=>{
			this.$updateTitle( res.log_Title );
		})
	}
};
</script>