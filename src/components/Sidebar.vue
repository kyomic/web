<template>
  <div class="mod-sidebar">
    <div class="sidebar-item">
      <h4>
        小伙伴们
      </h4>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
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