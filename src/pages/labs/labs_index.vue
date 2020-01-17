<template>
  <div class="wrapper">
  	<div>index</div>
    <div class="imglayer" ref="imglayer">
    </div>
    <div class="controls">
      empty
    </div>    
  </div>
</template>
<script>
export default {
  name: 'HelloWorld',
  components:{},
  data() {
    return {
     
    };
  },

  computed:{
    
  },
  watch:{
  },
  methods:{
    
  },
  mounted(){    
    console.log('mounted.')
  }
}

</script>
<style lang="less">  
  canvas1{
    width:400px;
    height: 300px;
  }
</style>
<style lang="less" scoped>  
  .label{
    display: inline-block;
    width:80*@rem;
    text-align: right;
    margin-right: 5*@rem;
  }
  .kslider span{
    display: block;
    height: 100%;
    border: 1px solid red;
  }
  
</style>
