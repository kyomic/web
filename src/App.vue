<template>
    <div class="root" id="app">
        <el-row type="flex" justify="space-between" class="header">
            <el-col class="hidden-xs-only">
                <HomeMenu></HomeMenu>
            </el-col>
            <el-col :class="mobile?'mobile-header':'mobile-header mobile-header-full'" :sm="8">
                <div class="hidden-sm-and-up">
                    <a href="/"><i class="el-icon-s-home"></i></a>
                </div>
                <div class="menu-right">
                    <HeaderSearch :router="router.go"></HeaderSearch>
                    <div class="btn-drawer hidden-sm-and-up" v-on:click="showDrawer">
                        <i class="el-icon-menu"></i>
                    </div>
                    <div class="btn-drawer hidden-sm-and-up">
                        <div v-if="isLogined">
                          <router-link :to="'/account/info?id='+userinfo.user_id" >
                            <i class="el-icon-user-solid">{{userinfo.ulevel==3?'Tester':''}}</i>
                          </router-link>
                        </div>
                        <div v-else>
                          <router-link :to="loginurl" >
                          <i class="el-icon-user-solid"></i>
                          </router-link>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
        <el-drawer
            title="导航"
            :visible.sync="drawer">
            <div class="mod-drawer">
                <div class="menu" v-if="isAdmin">
                  <h2>
                    <a :href="adminurl">管理</a>
                  </h2>
                  <h2>
                    <a @click="onLogout">退出</a>
                  </h2>
                </div>
                <div class="sidebar-item">
                  <h2>
                    小伙伴们
                  </h2>

                </div>
            </div>            
        </el-drawer>
        <!-- 内容区开始 -->
        <el-row class="container" ref="abc" @scroll.native="onScroll">
            <el-col class="page-wrap page-wrap-scroll" :xs="24" :sm="18">
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
                <a class="beian" target='_blank'>鄂ICP备06007021号</a>
            </div>
            
        </div>
    </div>
  
</template>

<script>

import HomeMenu from "@/components/base/HomeMenu"
import HeaderSearch from "@/components/HeaderSearch"
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')

import Devices from '@/lib/core/Devices';
import config from '@/lib/config';
import reporter from '@/lib/reporter'

console.log("CONFIG", config)

export default {
  name: 'App',
  components: {HomeMenu, HeaderSearch },
  metaInfo: {},
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
    ...mapGetters('user',['isLogined', 'userinfo', 'isAdmin']),
    loginurl:function(){
      let ref = '';
      if( this.router && this.router.current ){
        ref = this.router.current.fullPath;
      }
      return '/account/login?ref=' + ref
    },
    adminurl(){
      if( config.dev ){
        return '/admin.html';
      }
      return config.host.admin;
    },
    router_str(){
      return'';
      return JSON.stringify( this.router.to )
    }
  },
  methods:{
    ...mapMutations("search", ["showSearch"]),
    ...mapMutations("env", ["setGrid24","updateRouter","scrolling"]),
    ...mapActions('user',['loginstate','logout']),
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
    },
    abc:function(){
      alert(1)
    },
    onScroll(){
      Devices.getInstance().emit('scroll');
    }
  },
  mounted(){
    console.log("app mounted:dev", config.dev)

    console.log("登录的用户信息", this.userinfo)
    let devices = Devices.getInstance();
    devices.context = window;
    devices.on('resize', this.checkSize );
    devices.on('load', this.checkSize );
    devices.on('scroll', (e)=>{
      this.$root.$emit("scroll", e.data );
    })
    devices.on('reachbottom', (e)=>{
      this.$root.$emit("reachbottom", e.data );
    })

    this.$root.$on("drawer", (data)=>{
      this.drawer = data;
    })

    console.log("this",this,"container")

    let path = this.$route.fullPath;
    console.log("app mounted, path", path, this.$route)

    if( (path == '' || path == '/') && !config.dev ){
      //修复admin页面的主页和www的路由冲突
      if( /admin/ig.exec( location.href )){
        location.href = config.host.admin;
      }
    }

    if( config.dev ){
      console.log("path", path)
    }
    this.updateRouter( {to:this.$route} );

    this.loginstate();

    this.$store.dispatch("user/session");
    this.$store.dispatch('blogsite/info');
    this.$store.dispatch('figuresite/info').then(res=>{
      this.$root.$emit('siteinfo');
    })

    reporter.log('bootstrap');
    reporter.log('page', {
      url: [location.protocol, "//", location.host , this.$route.fullPath].join('')
    });
  }
}
</script>

<style lang="less">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #5d5d5d;
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
    width: 100%;
    background: white;
    margin-top: 5*@rem;
}
.beian{
  color: #ccc;
  font-size: 9px;
}



</style>
