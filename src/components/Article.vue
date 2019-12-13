<template class="page-article">
  <div class="hello">
    <el-row>
        <el-col class="col hidden-xs-only"  :xs="{offset:100}" :sm="9" :md="6" :lg="0" :xl="0">123</el-col>
        <el-col class="col" :xs="12" :sm="15" :md="18" :lg="21" :xl="24">456</el-col>
    </el-row>
  </div>
</template>

<script>
import 'element-ui/lib/theme-chalk/display.css';
export default {
  name: 'Article',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .col{
        border:1px solid red;
    }
</style>
