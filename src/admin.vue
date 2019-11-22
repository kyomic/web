<template>
    <div class="root" id="admin">
        <el-row type="flex" justify="space-between" class="header">
            <el-col>
                <div class="menu-left">
                    <a :href="home">回首页</a>
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
        <div class="container" ref="container">
          <div class="page-wrap">
            <router-view/>
          </div>
        </div>
        
    </div>  
</template>

<script>
import Devices from '@/lib/core/Devices';
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import config from '@/lib/config'

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

    home(){
      if( config.dev ){
        return '/'
      }
      return config.host.www;
    }
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

    let devices = Devices.getInstance();
    devices.context = window;
    devices.on('resize', this.checkSize );
    devices.on('load', this.checkSize );


    let scrollInterval = 0;
    devices.on('scroll', (e)=>{
      this.$store.commit("env/scrolling", true);
      clearTimeout( scrollInterval );
      scrollInterval = setTimeout(()=>{
        this.$store.commit("env/scrolling", false);
      }, 2000 );
      this.$root.$emit("scroll", e.data );
    })
    devices.on('reachbottom', (e)=>{
      this.$root.$emit("reachbottom", e.data );
    })

    this.$root.$on("drawer", (data)=>{
      this.drawer = data;
    })

    /*
    console.log(".this.$refs.container", this)
    let scroller = this.$refs.container.querySelector("[data-scrollview]");
    if( scroller ){
      scroller.addEventListener('scroll', (e)=>{
        console.log('emit','reachbottom', this)
        this.$emit("reachbottom");
      })
    }
    */

    
    let path = this.$route.fullPath;
    console.log("admin mounted, path", path)
    if( path == '' || path == '/'){
      //修复admin页面的主页和www的路由冲突
      this.$router.replace({path: '/admin/index'})
    }


    this.$store.dispatch('blogsite/info');
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
.container{
  padding-bottom: 50*@rem;/**override*/
}
.pagination-tip{
  position: fixed;
  
  width:100%;
  text-align: center;
  z-index: 5;
  font-size: 12*@rem;
  
  margin-top: 5*@rem;
  color:#666;
  
  .transition(all);
  top: 0*@rem;
  opacity: 0;
  .pagination-tip-wrap{
    background: white;
    border:1px solid #F1F1F1;
    border-radius: 3*@rem;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.12);
    margin: 5*@rem;
    padding: 5*@rem;
  }
  .el-progress{
    width: 120*@rem;
    display: inline-block;
  }
  .pagination-tip-label{
    display: inline-block;
  }
}
.pagination-tip-show{
  top: 70*@rem;
  opacity: 1;
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


.mod-table{
  .el-button--mini{
    padding: 5px;
  }
  .el-button+.el-button{
    margin-left: 5px;
  }
}



</style>
