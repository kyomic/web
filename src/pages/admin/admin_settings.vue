<template>
  <div class="page-wrap page-wrap-scroll page-admin admin_article_edit">
    <div class="wrapper">
      <el-button size="small" type="primary" @click="onBlogStaticCache" :disabled="!btn_init_cache">重建博客缓存</el-button>
    </div>
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import { api } from '@/services/api';
let admin_settings = {
  name: 'admin_settings',
  data(){
    return {
      btn_init_cache:true,
      loading:true,
      tableColumns:[1,2,3]
    }
  },
  computed:{
    //环境状态
    ...mapState('env', ['grid24code','router']),
    ...mapGetters('env', ['mobile']),
    //用户状态
    ...mapGetters('user',['isLogined', 'userinfo']),
  },
  methods:{
    onBlogStaticCache(){
      this.btn_init_cache = false;
      api.common.init_cache().then(res=>{
        this.btn_init_cache = true;
        this.$message({message:"重建成功"})
      }).catch(e=>{
        this.$network(e);
        this.btn_init_cache = true;
      })
    }
  },
  mounted(){
    console.log("admin_settings is loaded")
  }
}
export {admin_settings};
export default admin_settings;
</script>
<style lang="less" scoped>
  .wrapper{
    padding: 10*@rem;
  }
</style>