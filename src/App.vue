<template>
    <div>
        <el-row type="flex" justify="space-between" class="header">
            <el-col class="hidden-xs-only">
                <div>
                    <HomeMenu></HomeMenu>
                </div>
            </el-col>
            <el-col :sm="24">
                <HeaderSearch></HeaderSearch>
            </el-col>
            
        </el-row>
       
        <el-row id="app">
            <el-col class="content" :xs="24" :sm="18">
                <router-view/>
            </el-col>     
            <el-col class="slider" :xs="0" :sm="4">
                <ul>
                    <li>1</li>
                    <li>2</li>
                    <li>3</li>
                </ul>
            </el-col>                   
        </el-row>

        <div class="footer">
            <div class="mobile-menu hidden-sm-and-up">
                <HomeMenu></HomeMenu>  
            </div>
            
        </div>
    </div>
  
</template>

<script>

import HomeMenu from "@/components/base/HomeMenu"
import HeaderSearch from "@/components/HeaderSearch"

import Devices from '@/lib/core/Devices';
export default {
  name: 'App',
  components: {HomeMenu, HeaderSearch},
  data(){
    return {
        search_kw:""
    }
  },
  mounted(){
    Devices.getInstance().context = window;
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

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.mobile-menu{
    text-align: center;
    padding-top: 20px;
}
</style>
