<template>
    <div class="root" id="app">
        <el-row type="flex" justify="space-between" class="header">
            <el-col class="hidden-xs-only">
                <div>
                    <HomeMenu></HomeMenu>
                </div>
            </el-col>
            <el-col :class="mobile?'mobile-header':'mobile-header mobile-header-full'" :sm="8">
                <div class="hidden-sm-and-up">
                    <i>back</i>
                </div>
                <div class="menu-right">
                    <HeaderSearch></HeaderSearch>
                    <div class="btn-drawer hidden-sm-and-up" v-on:click="showDrawer">
                        <i class="el-icon-menu"></i>
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
        <el-row class="container" ref="abc" @scroll.native="onScroll">
            <el-col class="page-wrap" :xs="24" :sm="18">
                <router-view/>
            </el-col>     
            <el-col class="slider" :xs="0" :sm="4">
                <Sidebar></Sidebar>
            </el-col>
        </el-row>        
        <div class="footer">
            <div class="info">
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
    ...mapState('env', ['grid24code']),
    ...mapGetters('env', ['mobile'])
  },
  methods:{
    ...mapMutations("search", ["showSearch"]),
    ...mapMutations("env", ["setGrid24"]),

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
    return;
   //使用Message组件
    this.$message({
      type:'success',
      message:'element-ui安装成功'
    });
   //使用Message组件
    this.$notify({
      title: '成功',
      message: 'element-ui安装成功',
      type: 'success'
    });


  }
}
</script>

<style lang="scss">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.header{
  position: relative;
  z-index: 10;
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

html.mobile{
  height: 100%;
  overflow: hidden;
  body,.root{
    height: 100%;
    overflow: hidden;
  }
  .root{
    padding: 10px;
  }
  .container{
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: relative;
    left: 0;
    top: 0;
  }
  .page-wrap{
    margin-top: 45px;
    margin-bottom: 45px;
    height:100%;
    overflow: hidden;
  }
}


</style>
