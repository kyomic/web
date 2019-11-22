<template>
	<div>
		<div class="article-item" v-for="(item) in list.data">
			<div class="article-header">
				<h2 class="title">
					<router-link :to="'/article/detail/?id=' + item.id">{{item.title}}</router-link>
				</h2>
			</div>
            <div class="article-content">{{item.desc}}</div>
        </div>
	</div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import request from "@/lib/request"

export default {
	name: 'abc',
	components: {},
	data() {
		return {
			maxpage:3,
			page:1,
			  msg: 'Welcome to Your Vue.js App',
			  arr:[1,2,3]
		};
	},
	computed:{
		...mapState('search',['list','loading','keyword']),
	},
	methods:{
		...mapActions("search", ["query"]),
	},


	mounted(){
		if( !this.keyword ){
			let key = this.$route.query.keyword;
			if( key ){
				this.query(key)
			}
		}else{
			this.query(this.keyword)
		}
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>

</style>
