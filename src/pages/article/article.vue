<template>
	<div class="page-wrap-content">
		
		<div class="mod-article article-item" v-for="(item) in list.data" v-if="!isEmpty">
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
	        	<div v-if="!item.log_IsShow">[隐藏日志]</div>
	        	<div class="content" v-html="item.log_Intro" @click="onClickBlog(item, $event)">

	        	</div>
	        	<router-link :to="'/article/detail/?id=' + item.id" v-if="item.log_More" class="article-more">查看更多</router-link>
	        </div>
	    </div>
	    <i v-if="loading" class="el-icon-loading loading"></i>
	    <KViewer :images="previewImgs" :show="showviewer" :data-show="showviewer" @hide="onHideViewer">
	    </KViewer>

	    <div class="mod-article article-empty" v-if="isEmpty || isLoaded">
			<span class="empty">无更多数据~~</span>
		</div>
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import Debug from "@/lib/debug";
import request from "@/lib/request"
import config from '@/lib/config'
import dom from '@/lib/core/dom'
import Devices from '@/lib/core/Devices'

import ScrollView from "@/components/ScrollView";
import KViewer from "@/components/KViewer"
import "./article.less"

export default {
	name: 'Article',
	components: {KViewer},
	data() {
		return {
			maxpage:3,
			page:1,
			msg: 'Welcome to Your Vue.js App',
			arr:[1,2,3],

			showviewer:false,
			previewImgs:[]
		};
	},
	computed:{
		...mapState('blog',['loading', 'list', 'scrollTop']),
		...mapGetters('env', ['mobile']),
		...mapGetters('blog', ['isEmpty','isLoaded'])
	},
	methods:{
		...mapActions("blog", ["nextPage","query"]),
		...mapMutations('blog',['updateScroll']),
		
		onHideViewer(){
			this.previewImgs = [];
			this.showviewer = false;
		},
		onClickBlog(data, e){
			let target = e.target;
			if( target && target.nodeName.toLowerCase() == 'img'){
				let imgs = data.log_Content || data.log_Intro;
				this.$preview( imgs );
			}
		},
		onReachBottom:function(){
			this.nextPage();
		},
		onScroll(e){
			let target = e;
			this.updateScroll( target.scrollTop );
			this.animate();
		},

		animate(){
			let tr = document.querySelectorAll(".article-item");
		    tr = Array.from(tr);
		    let scrollTop = Devices.getInstance().scrollPosition.y;
		    let viewHeight = Devices.getInstance().viewSize.height;
		    tr.map((res,i)=>{
		      if( !dom.hasClass(res,'article-item-show')){
		        let pos = dom.offset( res );
		        if(  pos.top  < scrollTop + viewHeight ){
		        	dom.addClass(res,'article-item-show')		        	
		        }		        
		      }
		    })
		}
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
	watch:{
	    '$route':function( val ){
	      console.log("router ---------", val);
	      this.query( val.query );
	    }
	},
	updated(){
		this.animate();
	},
	beforeUpdate(){
		this.animate();
	},
	mounted(){
		let data = this.list.data;
		if( !data || data.length <=0 ){
			this.nextPage( this.$route.query ).then(res=>{
				//this.nextPage()
				this.$highlight( this.$el );
			}).catch(e=>{
				this.$network(e);				
			});
		}else{
			this.animate();
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
