<template ref="debugger">
  <div class="hello">
  </div>
</template>

<script>
export default {
  name: 'Debugger',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){
    console.log("debugger is loaded.")
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .col{
        border:1px solid red;
    }
</style>
