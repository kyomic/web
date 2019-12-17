<template>
  <div>
    404
    <div v-if="type='article'">文章找不到</div>
  </div>
  
</template>
<script>
	export default {
		name: 'Debugger',
		data() {
			return {
				type:""
			};
		},
		mounted(){
			let query = this.$route.query;
			this.type = query.type;
		}
	};
</script>