<template>
  <div class="hello">
    基于Vue的BLOG, 快速构建ing...
  </div>


</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){
    console.log("默认控制器", this.$route)
    let loc = location.href;
    if( /admin/ig.exec( loc )){
      this.$router.push({path: '/admin/index', query: {}})
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
