<template>
  <div class="page-wrap">
    <div class="article-item">
      <p><span class="label">[vx]: </span>kyomic</p>
      <p><span class="label">[mail]: </span>kyomic[@]163.com</p>
      <p><span class="label">[twitter]: </span><a href="https://twitter.com/bytearray/" target="_blank">https://twitter.com/bytearray/</a></p>
      <div class="social-link">
        <a href="#" class="github"></a>
        <a href="#" class="weixin"></a>
        <a href="#" class="twitter"></a>
        <a href="#" class="mail"></a>
        <a href="#" class="rss"></a>
      </div>
    </div>
    
  </div>


</template>

<script>
import KSlider from '@/components/KSlider';
export default {
  name: 'HelloWorld',
  components:{ KSlider },
  data() {
    return {
      data:[1,2,3],
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){

    setTimeout(()=>{
      this.data=['a','b','c','d','e']
    },5000)
  }
};
</script>

<style lang="less" scoped>
  .kslider .item{
    height: 100px;
  }
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
