<template>
    <div class="root" id="app">
        <el-row type="flex" justify="space-between" class="header">
            <el-col class="hidden-xs-only">
                <HomeMenu></HomeMenu>
            </el-col>
            <el-col :class="mobile?'mobile-header':'mobile-header mobile-header-full'" :sm="8">
                <div class="hidden-sm-and-up">
                    <i>back</i>
                </div>
                <div class="menu-right">
                    <HeaderSearch :router="router.go"></HeaderSearch>
                    <div class="btn-drawer hidden-sm-and-up" v-on:click="showDrawer">
                        <i class="el-icon-menu"></i>
                    </div>
                    <div class="btn-drawer hidden-sm-and-up">
                        <div v-if="isLogined">
                          <router-link :to="'/account/info?id='+userinfo.user_id" >
                            <i class="el-icon-user-solid">{{userinfo.user_id}}</i>
                          </router-link>
                        </div>
                        <div v-else>
                          <router-link :to="loginurl" >
                          <i class="el-icon-menu"></i>
                          </router-link>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
        <el-drawer
            title="导航"
            :visible.sync="drawer">
            <div>
                <Sidebar></Sidebar>
            </div>            
        </el-drawer>
        <!-- 内容区开始 -->
        <el-row class="container" ref="abc" @scroll.native="onScroll">
            <el-col class="page-wrap" :xs="24" :sm="18">
                <router-view/>
            </el-col>     
            <el-col class="slider" :xs="0" :sm="4">
                <Sidebar></Sidebar>
            </el-col>
        </el-row>      
        <!-- 内容区结束 -->  
        <div class="footer">
            <div class="info" style="display:none">
                @copyright
            </div>
            <div class=" mobile-footer-menu hidden-sm-and-up">
                <HomeMenu></HomeMenu>  
            </div>
            
        </div>
    </div>
  
</template>

<script>

import HomeMenu from "@/components/base/HomeMenu"
import HeaderSearch from "@/components/HeaderSearch"
import Sidebar from "@/components/Sidebar"
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

import Devices from '@/lib/core/Devices';
import config from '@/lib/config';
import axios from 'axios';

console.log("CONFIG", config)

export default {
  name: 'App',
  components: {HomeMenu, HeaderSearch, Sidebar },
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
    ...mapState('search', [
        'shown'
    ]),
    ...mapState('env', ['grid24code','router']),
    ...mapGetters('env', ['mobile']),
    ...mapGetters('user',['isLogined', 'userinfo']),
    loginurl:function(){
      let ref = '';
      if( this.router && this.router.current ){
        ref = this.router.current.fullPath;
      }
      return '/account/login?ref=' + ref
    },
    router_str(){
      return'';
      return JSON.stringify( this.router.to )
    }
  },
  methods:{
    ...mapMutations("search", ["showSearch"]),
    ...mapMutations("env", ["setGrid24","updateRouter"]),

    showDrawer(){
        this.drawer = true
    },
    checkSize(){
        //更新env.mobile类型
        let code = Devices.getInstance().grid24code;
        this.setGrid24( code );

        let html = Devices.getInstance().query("html");
        if( html && this.mobile ){
          html.className = 'mobile'
        }
    },
    abc:function(){
      alert(1)
    },
    onScroll(){
      console.log("scrolling.......")
      Devices.getInstance().emit('scroll');
    }
  },
  mounted(){
    Devices.getInstance().context = window;


    Devices.getInstance().on('resize', this.checkSize );
    Devices.getInstance().on('load', this.checkSize );
    console.log("this",this,"container")

    axios.get( config.api + '/api/user/list').then( res=>{
      console.log("res======",res)
    }).catch(e=>{
      console.error('*** Error:' + e + " ***")
    })
    console.log("@@@@@@@@@@@@@@@@@", this)
    this.updateRouter( {to:this.$route} );
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
  position: absolute;
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
