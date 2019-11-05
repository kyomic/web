<template>
    <div class="root" id="app">
        <router-view/>
    </div>  
</template>

<script>


console.log("CONFIG( ADMIN)")

export default {
  name: 'App',
  components: {},
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
    
  },
  methods:{
    
  },
  mounted(){
    
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
