<template>
    <div class="root" id="admin">
        <el-row type="flex" justify="space-between" class="header">
            <el-col>
                <div class="menu-left">
                    <a href="/">首页1</a>
                </div>
            </el-col>
            <el-col>                
                <div class="menu-right">
                    <div class="btn-drawer hidden-sm-and-up" v-on:click="showDrawer">
                        <i class="el-icon-menu"></i>
                    </div>
                </div>
            </el-col>
        </el-row>
        <el-drawer
            title="导航1"
            :visible.sync="drawer">
            <div class="mod-drawer">
                <admin_menu></admin_menu>
            </div>            
        </el-drawer>
        <router-view/>
    </div>  
</template>

<script>
import Devices from '@/lib/core/Devices';
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

import admin_menu from '@/pages/admin/admin_menu'
console.log("CONFIG( ADMIN)", admin_menu)

export default {
  name: 'admin',
  components: {admin_menu},
  metaInfo: {
    title: 'This is the test',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no' }
    ]
  },
  data(){
    return {
        search_kw:"",
        drawer:false
    }
  },
  computed:{
    ...mapGetters('user',['isLogined', 'userinfo']),
  },
  methods:{
    ...mapActions('user',['loginstate']),
    showDrawer:function(){
      this.drawer = true;
    }
  },
  mounted(){
    Devices.getInstance().context = window;
    this.loginstate().then(res=>{
      /*
      if( false || !res || !res.level || res.level < 3 ){
        console.log("router",this.$route)
        this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
      }
      */
    });
  }
}
</script>

<style lang="less">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.header{
  z-index: 10;
  font-size: 20*@rem;
  width:100%;
  padding: 5px;
}
.footer{
    padding-top: 50px;
    text-align: center;
}
.mobile-menu{
    text-align: center;
    padding-top: 20px;
}
.mobile-header{
    display: flex;
    justify-content:space-between;
}
.mobile-header-full{
  .menu-right{
    width: 100%;
  }
  
}
.btn-drawer{
    display: inline-block;
}
.mobile-footer-menu{
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: white;
}




</style>
