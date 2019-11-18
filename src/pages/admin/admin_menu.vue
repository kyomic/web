<template>
	<div class="menu>">
		<h2><router-link to="/admin/index">管理首页</router-link></h2>
		<h2><router-link to="/admin/article">文章管理</router-link></h2>
		<h2><router-link to="/admin/tag">标签管理</router-link></h2>
		<h2><router-link to="/account">AboutME</router-link></h2>
		<h2><router-link to="/admin/settings">博客设置</router-link></h2>
		<div class="divider"></div>
		<h2><router-link to="/admin/task">站点任务</router-link></h2>
		<h2><router-link to="/admin/figure">模型站</router-link></h2>
		<div class="divider"></div>
		<h2><a @click="onClick">退出</a></h2>
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import {urls} from '@/lib/core/urls'
import qs from 'qs';
let admin_menu = {
	name:'admin_menu',

	methods:{
		...mapActions('user',['logout']),
		onClick(){
			this.logout().then(res=>{
				/*
				let url = this.$route.fullPath;
        		let ref = urls.getQueryValue('ref', url);
        		if( ref ){
        			try{
        				ref = decodeURIComponent(ref)
        			}catch(e){}
        		}
        		console.log("url", qs.parse( url ), url,'ref', ref)
        		*/
			}).catch(e=>{
				this.$network(e);
			})
		}
	}
}
export default admin_menu;
export { admin_menu };
</script>