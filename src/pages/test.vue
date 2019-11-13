<template>
  <div class="hello">
    hello world
    <KSlider class="kslider" >
      <div class="item"><span>1</span></div>
      <div class="item"><span>2</span></div>
      <div class="item"><span>3</span></div>
      <div class="item"><span>4</span></div>
      <div class="item"><span>5</span></div>
      <div class="item"><span>6</span></div>
    </KSlider>
  </div>


</template>

<script>
import KSlider from '@/components/KSlider';
export default {
  name: 'HelloWorld',
  components:{ KSlider },
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){
  }
};
</script>

<style scoped>
  .kslider .item{
    height: 100px;
  }
  .kslider span{
    display: block;
    height: 100%;
  }
</style>
