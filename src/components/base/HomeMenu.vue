<template>
	<div class="menu>">
		<router-link to="/">Home</router-link>
		<router-link to="/article">Article</router-link>
		<router-link to="/element">Elements</router-link>
		<router-link to="/test">AboutME</router-link>
		
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
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