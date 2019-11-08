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
        <div class="container">
          <router-view/>
        </div>
        
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
    ...mapState(  'env', ['grid24code','router']),
    ...mapGetters('env', ['mobile']),

  },
  methods:{
    ...mapActions('user',['loginstate']),
    ...mapMutations("env", ["setGrid24","updateRouter"]),

    showDrawer:function(){
      this.drawer = true;
    },
    checkSize(){
        //更新env.mobile类型
        let code = Devices.getInstance().grid24code;
        this.setGrid24( code );
        console.log("checkSize", code)
        let html = Devices.getInstance().query("html");
        if( html && this.mobile ){
          html.className = 'mobile'
        }
    }
  },
  mounted(){
    Devices.getInstance().context = window;
    Devices.getInstance().on('resize', this.checkSize );
    Devices.getInstance().on('load', this.checkSize );

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
