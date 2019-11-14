<template>
	<ScrollView :loading="loading" :scrollTop="scrollTop" @reachbottom="onReachBottom" @scroll="onWrapperScroll" v-if="mobile">		
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.log_Title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.log_Intro}}</div>
        </div>
	</ScrollView>
	<div v-else>
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.log_Title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.log_Intro}}</div>
        </div>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import request from "@/lib/request"

import ScrollView from "@/components/ScrollView";
import "./article.less"

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
		...mapState('blog',['loading', 'list', 'scrollTop']),
		...mapGetters('env', ['mobile'])
	},
	methods:{
		...mapActions("blog", ["nextPage"]),
		...mapMutations('blog',['updateScroll']),

		onReachBottom:function(){
			this.nextPage();
		},
		onWrapperScroll:function(e){
			let target = e.currentTarget;
			this.updateScroll( target.scrollTop );
		},
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
		console.log("artilce is mounted", this)
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>

</style>
