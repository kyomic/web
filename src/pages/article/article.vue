<template>
	<div class="page-wrap-content">
		<div class="mod-article article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.log_Title}}</router-link>
				</h2>
				<div class="meta">
					<span class="meta-author">作者:{{item.log_Author}}</span>
					<span class="meta-author">日期:{{item.log_PostTime}}</span>
				</div>
			</div>
	        <div class="article-content">
	        	<div class="content" v-html="item.log_Intro">
	        	</div>
	        </div>
	    </div>
	    <i v-if="loading" class="el-icon-loading loading"></i>
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import Debug from "@/lib/debug";
import request from "@/lib/request"

import ScrollView from "@/components/ScrollView";
import "./article.less"

export default {
	name: 'Article',
	components: {},
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
		onScroll(e){
			console.log("scroll.............")
			let target = e;
			this.updateScroll( target.scrollTop );
		},
	},

	beforeDestroy(){
		if( this.onScrollHandler ){
			this.$root.$off('scroll',this.onScrollHandler )
			this.onScrollHandler = null;
		}
		if( this.onReachBottomHandler ){
			this.$root.$off('reachbottom',this.onReachBottomHandler )
		}
		
	},
	mounted(){
		let data = this.list.data;
		if( !data || data.length <=0 ){
			this.nextPage().then(res=>{
				this.nextPage()
			}).catch(e=>{
				this.$network(e);				
			});
		}
		this.$root.$onScroll = this.onScroll;
		this.$root.$onScrollBottom = this.onReachBottom;
		this.onScrollHandler = this.onScroll.bind(this);
		this.onReachBottomHandler = this.onReachBottom.bind(this);
		this.$root.$on('scroll',this.onScrollHandler )
		this.$root.$on('reachbottom',this.onReachBottomHandler )
		//this.nextPage();
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>

</style>
