<template>
	<div class="article-item">
		<h2 class="title">{{currentArticle.title}}</h2>
		<div>
			{{currentArticle.desc}}
		</div>
		<div class="article-footer">
			<div class="btn btn-reply" @click="onComment">评论</div>
		</div>
		<div class="comment" v-if="showCommentBox">
			<el-input
				type="textarea"
				:rows="2"
				placeholder="请输入内容"
				v-model="comment">
			</el-input>
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
		...mapState('article',['currentArticle']),
		...mapGetters('user', ['isLogined']),
	},
	methods:{
		...mapActions("article", ["getArticle"]),
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
		this.getArticle({id:id}).catch(e=>{
			console.error(e);
		})
	}
};
</script>