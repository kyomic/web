<template>
	<div class="mod-datenav" ref="datenav">
    <div v-for="(year,key,index) in years" :key="index">
      <div class="year-item">
        <div class="year">{{year}}</div>
        <div :class="equalCurrentYear(year) && expendMonth?'month month-expand':'month'">
          <div :data-year="year" :data-month="month" :class="equalCurrentYear(year) && equalCurrentMonth(year,month) && expendMonth?'month-item month-item-show':'month-item'" v-for="(month,key,index) in 12" :key="index" @click="onExpendMonth(year,month)">
            <div class="month-title">{{month}}</div>
            <div :class="equalCurrentMonth(year,month)?'day day-show':'day'">
              <i class="day-item" v-for="(day,key,index) in days" :key="index">{{day}}</i>
            </div>
          </div>
        </div>
      </div>
    </div>
	</div>
</template>

<script>

import dom from '@/lib/core/dom'

let nowdate = new Date();
export default {
  name: 'KDateNav',
  components:{},
  data() {
    return {
      start_year: nowdate.getFullYear(),
      currentYear: nowdate.getFullYear(),
      currentMonth: (nowdate.getMonth()+1),
      //是否展开月
      expendMonth:true,
      days:[],
    };
  },
  props:{
    data:{
      type:Array,default:function(){return []}, required:false
    },
  },
  computed:{    
    years(){
      let rs = [];
      for(let i= this.start_year; i> this.start_year - 10;i--){
        rs.push( i );
      }
      console.log("res===",rs)
      return rs;
    }
  },
  methods:{
    equalCurrentYear(year){
      return year == this.currentYear
    },
    equalCurrentMonth(year,month){
      return (year == this.currentYear) && (month == this.currentMonth)
    },
    onExpendMonth(year,month){
      this.currentYear = year;
      this.currentMonth = month;
      this.expendMonth = true;

      console.log("onExpendMonth", year,month)
      let maxday = new Date(year, month, 0).getDate();
      let days = Array.from({length:maxday}, (v,k) => k+1);
      this.days = days;
    }
  },
  beforeUpdate(){    
  },
  updated(){
  },
  mounted(){
  }
};
</script>
<style lang="less" scoped>
	.mod-datenav{

    .month-item{
      width:25%;
      display: inline-block;
      text-align: center;
      width: 0;
      overflow: hidden;
    }
    .month-expand{
      .month-item{
        width: 100%;
      }
    }
    .month-item-show{
      width: 25%;
    }
    .year,.month,.day{
      text-align: left;
    }
    .day{
      opacity: 0;
    }
    .day-show{
      opacity: 1;
    }
  }
</style>