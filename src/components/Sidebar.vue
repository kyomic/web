<template>
	<ul>
		<li>1</li>
		<li>2</li>
		<li>3</li>
	</ul>
</template>
<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App',
    };
  },
  mounted(){
    console.log("HelloWorld is mounted")
  }
};
</script>