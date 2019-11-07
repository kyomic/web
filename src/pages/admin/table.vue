<template>
 <table class="table">
 <thead>
  <slot name="columns"><!--这里定义了一个slot，名字叫columns，也就是说这里的内容是可以被替换掉的-->
  <th v-for="column in columns">
   {{column}}
  </th>
  </slot>
 </thead>
 <tbody>
 <tr v-for="item in data">
  <slot :row="item"><!--这里slot有一个prop是row-->
  <td v-for="column in columns"
   v-if="hasValue(item, column)">
   {{itemValue(item, column)}}
  </td>
  </slot>
 </tr>
 </tbody>
 </table>
</template>
<script>
  export default {
    data(){
      return {
        a:1
      }
    },
    props:{
      columns:{
        type:Array,required:false,
        default: function () {
            return []
        },
      },
      data:{
        type:Array,required:false,
        default: function () {
            return []
        },
      }
    },
    methods:{
      hasValue:function(a,b){
        return '1'
      },
      itemValue:function(item, column){
        return Math.random();
      }
    }
  }
</script>