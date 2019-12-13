<template>
	<div class="page-wrap page-wrap-scroll page-admin admin_article_edit">
    <div class="wrapper">
    </div>
  </div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
let admin_index = {
  name: 'admin_index',
  computed:{
  	//环境状态
    ...mapState('env', ['grid24code','router']),
    ...mapGetters('env', ['mobile']),
    //用户状态
    ...mapGetters('user',['isLogined', 'userinfo']),
  },
  mounted(){
  	
  }
}
export {admin_index};
export default admin_index;
</script>