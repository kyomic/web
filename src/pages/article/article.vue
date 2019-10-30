<template>
	<ScrollView :loading="loading" :onReachBottom="onReachBottom">		
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.desc}}</div>
        </div>
	</ScrollView>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import request from "@/lib/request"

import ScrollView from "@/components/ScrollView";

export default {
	name: 'Article',
	components: { ScrollView },
	data() {
		return {
			maxpage:3,
			page:1,
		  msg: 'Welcome to Your Vue.js App',
		  arr:[1,2,3]
		};
	},
	computed:{
		...mapState('article',['loading']),
		...mapGetters('article', ['list']),
	},
	methods:{
		...mapActions("article", ["nextPage"]),
		onReachBottom:function(){
			this.page +=1;
			if( this.page > this.maxpage) return;
			this.nextPage();
		}
	},


	mounted(){
		let data = this.list.data;
		if( !data || data.length <=0 ){
			this.nextPage().then(res=>{
				console.log("loaded..******")
				this.nextPage()
			})
		}
		
		//this.nextPage();
		console.log("artilce is mounted", this.list)
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
    .article-item{
		.title{
			text-align: left;
		}
    }
</style>
