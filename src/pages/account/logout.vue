<template>
	<div>正在退出</div>
</template>
<script>
	let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
	import {urls} from '@/lib/core/urls'
	import qs from 'qs';
	let info = {
		name: 'userinfo',
		components: {},
		data() {
			return {
				
			};
		},
		computed:{
			...mapState('env', ["router"]),
			...mapGetters('user', ['isLogined']),
		},
		methods:{
			...mapActions('user',['logout'])
		},
		mounted(){
			console.log(this.$router);
			this.logout().then(res=>{
				let url = this.$route.fullPath;
        		let ref = urls.getQueryValue('ref', url);
        		if( ref ){
        			try{
        				ref = decodeURIComponent(ref)
        			}catch(e){}
        		}
        		console.log("url", qs.parse( url ), url,'ref', ref)
			}).catch(e=>{
				this.$network(e);
			})
		}
	}
	export default info;
	export {info}
</script>
