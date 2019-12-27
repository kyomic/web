<template>
	<div class="menu">
		<router-link to="/">Home</router-link>
		<router-link to="/article">Article</router-link>
		<a href="http://labs.shareme.cn">Labs</a>
		<router-link to="/test">AboutME</router-link>
		
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import {urls} from '@/lib/core/urls'
import qs from 'qs';
let admin_menu = {
	name:'admin_menu',

	methods:{
		
	}
}
export default admin_menu;
export { admin_menu };
</script>