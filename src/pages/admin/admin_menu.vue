<template>
	<div class="menu>">
		<h2><router-link to="/admin/index">管理首页</router-link></h2>
		<h2><router-link to="/admin/article">文章管理</router-link></h2>
		<h2><router-link to="/admin/tag">标签管理</router-link></h2>
		<h2><router-link to="/account">AboutME</router-link></h2>
		<h2><router-link to="/admin/task">站点任务</router-link></h2>
		<h2><router-link to="/admin/figure">模型站</router-link></h2>
		<h2><router-link to="/admin/logout">退出</router-link></h2>
	</div>
</template>
<script>
let admin_menu = {
	name:'admin_menu'
}
export default admin_menu;
export { admin_menu };
</script>