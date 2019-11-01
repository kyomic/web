<template>
	<div class="article-item">
		<h2 class="title">{{currentArticle.title}}</h2>
		<div>
			{{currentArticle.desc}}
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
		 
		};
	},
	computed:{
		...mapState('article',['currentArticle']),
	},
	methods:{
		...mapActions("article", ["getArticle"]),
	},
	mounted(){
		let id = this.$route.query.id;
		this.getArticle({id:id}).catch(e=>{
			console.error(e);
		})
	}
};
</script>