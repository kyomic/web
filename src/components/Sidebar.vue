<template>
  <div class="mod-sidebar">
    <div class="sidebar-item">
      <h4>
        <a :href="adminurl">管理</a>
      </h4>
      <h4>
        <a @click="onLogout">退出</a>
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
import qs from 'qs';

import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import {urls} from '@/lib/core/urls'

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
  methods:{
    ...mapActions('user',['logout']),
    onLogout(){
      this.logout().then(res=>{
        /*
        let url = this.$route.fullPath;
            let ref = urls.getQueryValue('ref', url);
            if( ref ){
              try{
                ref = decodeURIComponent(ref)
              }catch(e){}
            }
            console.log("url", qs.parse( url ), url,'ref', ref)
            */
      }).catch(e=>{
        this.$network(e);
      })

      this.$root.$emit("drawer",false);
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