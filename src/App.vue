<template>
  <div id="app">
    <HomeMenu></HomeMenu>
    <router-view/>
  </div>
</template>

<script>

import HomeMenu from "@/components/base/HomeMenu"

export default {
  name: 'App',
  components: {HomeMenu},
  mounted(){
    return;
   //使用Message组件
    this.$message({
      type:'success',
      message:'element-ui安装成功'
    });
   //使用Message组件
    this.$notify({
      title: '成功',
      message: 'element-ui安装成功',
      type: 'success'
    });
  }
}
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
