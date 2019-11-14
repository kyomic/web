<template>
  <div class="mod-sidebar">
    <div class="sidebar-item">
      <h4>
        <a :href="adminurl">管理</a>
      </h4>
    </div>
    <div class="sidebar-item">
      <h4>
        小伙伴们
      </h4>
    </div>
  </div>
</template>
<script>
import config from '@/lib/config';
export default {
  name: 'Sidebar',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  computed:{
    /** 显示的模板 **/
    adminurl(){
      if( config.dev ){
        return '/admin.html';
      }
      return config.host.admin;
    }
  },
  mounted(){
    console.log("HelloWorld is mounted")
  }
};
</script>
<style lang="less">
  .mod-sidebar{
    padding: 10*@rem;
  }
</style>