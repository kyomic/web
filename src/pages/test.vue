<template>
  <div class="hello">
    hello world
    <KSlider class="kslider" >
      <div  v-for="(item,index) in data" :class="'item '+ item"><span>{{item}}</span></div>
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
      data:[1,2,3],
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){

    setTimeout(()=>{
      this.data=['a','b','c','d','e']
      console.log("newdata",this.data)
    },5000)
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
    border: 1px solid red;
  }
</style>
