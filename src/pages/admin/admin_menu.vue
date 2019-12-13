<template>
	<div class="menu>">
		<h2><router-link @click.native="onRouteClick" to="/admin/index">管理首页</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/admin/article">文章管理</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/admin/tag">标签管理</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/admin/log">日志管理</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/account">AboutME</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/admin/settings">博客设置</router-link></h2>
		<div class="divider"></div>
		<h2><router-link @click.native="onRouteClick" to="/admin/task">站点任务</router-link></h2>
		<h2><router-link @click.native="onRouteClick" to="/admin/figure">模型站</router-link></h2>
		<div class="divider"></div>
		<h2><a @click="onClick">退出</a></h2>
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import {urls} from '@/lib/core/urls'
import qs from 'qs';
let admin_menu = {
	name:'admin_menu',

	methods:{
		...mapActions('user',['logout']),
		onClick(){
			this.logout().then(res=>{
				
			}).catch(e=>{
				this.$network(e);
			})
		},
		onRouteClick(){
			if( this.timeoutId ){
				clearTimeout( this.timeoutId );
			}
			this.timeoutId = setTimeout(_=>{
				this.$root.$emit('drawer',false);
			},300)
			
		}
	}
}
export default admin_menu;
export { admin_menu };
</script>