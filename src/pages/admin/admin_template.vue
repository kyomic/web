<template>
	<div class="page-admin admin_index">
		admin
	</div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
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
  	console.log("admin_index is loaded")
  }
}
export {admin_index};
export default admin_index;
</script>