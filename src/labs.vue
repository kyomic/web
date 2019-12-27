<template>
    <div class="root" id="labs">
        <el-row type="flex" justify="space-between" :class="mobile?'header mobile-header':'header'">
            <el-col>
                <div class="menu-left">
                    <a :href="home"><i class="el-icon-s-home"></i><em>Labs</em></a>
                </div>
            </el-col>
            <el-col>                
                <div class="menu-right">
                    <div class="btn-drawer hidden-sm-and-up"  v-on:click="showDrawer">
                        <i class="el-icon-menu"></i>
                    </div>
                </div>
            </el-col>
        </el-row>

        <el-drawer
            title="导航"
            size="50%"
            :visible.sync="drawer">
            <div class="mod-drawer">
              <labs_menu></labs_menu>
            </div>            
        </el-drawer>
        <div class="container" ref="container" v-if="mobile">
          <router-view/>
        </div>
        <div class="container" ref="container" v-else>
          <div class="page-wrap">
            <div class="menu">
              <labs_menu></labs_menu>
            </div>
            <div class="page-right">
              <router-view/>
            </div>
          </div>
        </div>
        
    </div>  
</template>

<script>
import Devices from '@/lib/core/Devices';
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import config from '@/lib/config'
import labs_menu from '@/pages/labs/labs_menu'

export default {
  name: 'labs',
  components: {labs_menu},
  metaInfo: {
    title: 'This is the test',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no' }
    ]
  },
  data(){
    return {
      activeName:"a",
        search_kw:"",
        drawer:false
    }
  },
  computed:{
    ...mapState('env', ['grid24code','router']),
    ...mapGetters('env', ['mobile']),
    home(){
      if( config.dev ){
        return '/labs.html#/labs/index'
      }
      return config.host.www;
    }
  },
  methods:{
    ...mapMutations("env", ["setGrid24","updateRouter"]),
    showDrawer:function(){
      this.drawer = true;
    },
    checkSize(){
        //更新env.mobile类型
        let code = Devices.getInstance().grid24code;
        this.setGrid24( code );
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

    let path = this.$route.fullPath;
    debug && console.log("labes mounted, path", path)
    if( path == '' || path == '/'){
      //修复admin页面的主页和www的路由冲突
      this.$router && this.$router.replace({path: '/labs/index'})
    }
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
.menu-left em{
  font-size: 16*@rem;
}
.container{
  max-width: 1180px;
  min-width: 860px;
  width: 100%;
  position: relative;
  .page-wrap{
    padding-top: 20*@rem;
  }
}
.mobile .container{
  max-width: auto;
  min-width: auto;
}
.menu{
  width: 200*@rem;
  position: absolute;
  min-height: 100*@rem;
  .el-collapse-item{
    padding-left: 10*@rem;
  }
  router-link{
    display: inline-block;
  }
}
.page-right{
  width: 100%;
  margin-left: 220*@rem;
}

.controls{
  width: 200*@rem;
  position: absolute;
  right: 10*@rem;
  top: 50*@rem;
  box-shadow:0px 0px 10px rgba(0,0,0,0.1);
  background: white;
  .el-collapse-item{
    padding:0 5px;
  }
  .el-collapse-item__header{
    padding-left: 0px;
    height: 30px;
    line-height: 30px;
  }
  .filter-title{
    padding-left: 5*@rem;color: #ccc;
  }
  .filter-options{
    padding: 5*@rem;

    /**slider*/
    .el-slider{
      padding:0px 10*@rem;
    }
  }
  .filter-btn{
    background: white;
    padding: 5*@rem;
  }  
}
.mobile .controls{
  width: 100*@rem;
  .el-button+.el-button{
    margin-left: 0;
  }
  .el-button{
    margin-bottom: 5*@rem;
  }
}
</style>
