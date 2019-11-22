<template>
	<div>用户信息：
	{{userinfo.user_id}}:{{userinfo.token}}
	</div>
</template>
<script>
	let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
	let info = {
		name: 'userinfo',
		components: {},
		data() {
			return {
				
			};
		},
		computed:{
			...mapState('env', ["router"]),
			...mapGetters('user', ['userinfo','isLogined']),
		},
		methods:{
			
		},
		mounted(){
			if( !this.isLogined ){
				this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
			}
		}
	}
	export default info;
	export {info}
</script>
