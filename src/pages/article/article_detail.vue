<template>
	<div class="1">
		<h2>{{currentArticle.title}}</h2>
		<div>
			{{currentArticle.desc}}
		</div>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
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