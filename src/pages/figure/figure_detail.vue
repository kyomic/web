<template>
	<div class="page-wrap-content">
		<i v-if="loading" class="el-icon-loading loading"></i>
		<div class="article-image">
			<KSlider class="kslider" v-if="figure_imgs && figure_imgs.length">
				<div class="item" v-for="(item,index) in figure_imgs">
					<img :src=" host.www + '/'+item"></img>
				</div>
			</KSlider>
		</div>
		<div class="article-item" v-show="!loading">
			
			<div class="article-header">
				<h2 class="title">
					{{item.figure_name}}
					<router-link v-if="isAdmin" :to="'/admin/figure_edit/?id=' + item.id">
						<i class="i-edit el-icon-edit"></i>
					</router-link>
					
				</h2>
				<div class="meta">					
					<div>
						<span class="meta-author">日期:{{toDate(item.figure_update_date)}}</span>
						<span class="meta-from">
							来源:<a :href="item.figure_refer" target="_blank" >{{item.figure_site_name}}</a>
						</span>
					</div>
				</div>
			</div>
            <div class="article-content">
            	<div class="content" v-html="item.log_Content" @click="onClickBlog(item, $event)">
            		{{item.log_Content}}
            	</div>
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
            		<router-link v-if="item.prev" :to="'/figure/detail?id=' + item.prev.id">
						上一条: {{item.prev.figure_name}}
					</router-link>
					<router-link v-if="item.next" :to="'/figure/detail?id=' + item.next.id">
						下一条: {{item.next.figure_name}}
					</router-link>
            	</div>
            </div>
            <KComment :id="item.id"></KComment>
		</div>
	</div>	
	
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')

import utils from '@/lib/core/utils'
import KComment from '@/components/KComment'
import KSlider from '@/components/KSlider'
import "./figure.less"
export default {
	name: 'Figure',
	components:{KSlider,KComment},
	data() {
		return {
			article_id:0,
			comment:"",

			showCommentBox:false
		};
	},
	computed:{
		//环境状态
		...mapState('env', ['grid24code','router', 'host']),
		...mapGetters('env', ['mobile']),

		...mapState('figure',['loading','detail']),
		...mapGetters('figuresite',['siteinfo']),
		...mapGetters('user', ['isLogined','isAdmin']),

		
		item(){
			return this.detail
		},
		figure_imgs(){
			if( this.detail && this.detail.figure_imgs ){
				return this.detail.figure_imgs.split(",")
			}
			return [];
		}
	},
	methods:{
		...mapActions("figure", ["info","update"]),
		...mapMutations("figure", ["updateInfo"]),
		
		onComment:function(){
			if( !this.isLogined ){
				this.$router.push({path: '/account/login', query: {'ref': this.router.current.fullPath}})
			}else{
				this.showCommentBox = true;
			}
			
		}, 
		onSiteUpdate(){
			let info = this.siteinfo.site || [];
			let data = this.detail;
			let figure_site = data.figure_site || 2;
			let site = ( info || []).find(res=>{
				return Number(res.id) == Number(figure_site)
			});
			if( site ){
				this.detail.figure_site_name = site.name;
				this.updateInfo( this.detail );
			}
		},
		onMounted(){
			let id = this.$route.query.id;
			this.info({id:id}).then(res=>{
				this.onSiteUpdate();
			})
		},
		toDate( num ){
			let date = new Date( parseInt(num+"")*1000);
			return date.Format("yyyy-MM-dd hh:mm:ss");
		}
	},
	watch: {
	    // 如果路由有变化，会再次执行该方法
	    '$route':function(data){
	    	console.log("route change", data)
	    	this.onMounted();
	    }
	},
	mounted(){
		if( this.siteinfo.site && this.siteinfo.site.length){

		}else{
			this.$root.$on('siteinfo', (e=>{
				this.onSiteUpdate();
			}))
		}
		this.onMounted();
	}
};
</script>
<style lang="less" scoped>
	.i-edit{
		color:#409EFF;
	}
	.kslider .item{
	    height: 300*@rem;
	    text-align: center;
	    img{
	    	display: inline-block;
	    	height: 100%;
	    }
	 }
</style>