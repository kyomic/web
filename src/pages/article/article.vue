<template>
	<ScrollView :loading="loading" :scrollTop="scrollTop" @reachbottom="onReachBottom" @scroll="onWrapperScroll" v-if="mobile">		
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.desc}}</div>
        </div>
	</ScrollView>
	<div v-else>
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.desc}}</div>
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

		...mapState('article',['loading']),
		...mapGetters('article', ['list','scrollTop']),
		...mapGetters('env', ['mobile'])
	},
	methods:{
		...mapActions("article", ["nextPage"]),
		...mapMutations('article',['updateScroll']),

		onReachBottom:function(){
			this.page +=1;
			if( this.page > this.maxpage) return;
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
		console.log("artilce is mounted", this.list)
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>

</style>
