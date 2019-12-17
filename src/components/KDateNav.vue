<template>
  <div class="mod-datenav">
  	<div :class="showmore?'years years-expand':'years'">
      <div v-for="(year,key,index) in years" :key="index">
        <div :class="equalCurrentYear(year)?'year-item year-item-show':'year-item'">
          <div class="year-title" @click="onExpandYear(year)">{{year}}</div>
          <div 
          :class="equalCurrentYear(year) && expandMonth?'month month-expand':'month'"
          :style="{height:daysHeight(year)+'px'}"
          >
            <div
            :class="equalCurrentYear(year) && equalCurrentMonth(year,month) && expandMonth?'month-item month-item-show':'month-item'" v-for="(month,key,index) in matchMonth(year,month)" 
            :key="index">
              <div class="month-title" @click="onExpandMonth(year,month)">               
                <i>{{month}}月</i>
              </div>
              <div :class="equalCurrentMonth(year,month)?'day day-show':'day'"
                :style="{'transition-delay':animateDayDelay}"
              >
                <div :class="matchDay(year,month,day)?'day-item day-item-matched':'day-item'" v-for="(day,key,index) in days" :key="index">
                  <i>{{day}}</i>
                </div>                
              </div>
            </div>
          </div>
        </div>
      </div>
  	</div>
    <div class="more" @click="onShowMore" v-if="!showmore">更多..</div>
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
      expandMonth:true,
      expandYear: false,
      showmore:false,
      animateDayDelay:"0.5s",

      cacheYear:{},
      cacheLog:{},
      days:[],
      query:{},
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
      if( this.data ){
        let cache = this.cacheLog;
        let cacheYear = this.cacheYear;
        for(let i=0;i<this.data.length;i++){
          let date = new Date( this.data[i]["log_PostTime"]);
          let day_str = date.Format("yyyy-MM-dd");

          let year = date.getFullYear();
          let month = date.getMonth()+1;
          if( !cache[year]){
            rs.push( year );
            cache[year] = true;
          }
          if( !cache[ day_str ] ){
            cache[day_str] = 1;
          }else{
            cache[day_str] += 1;
          }
          
          if( !cacheYear[year]){
            cacheYear[year] = [];
          }
          if( cacheYear[year].indexOf(month)==-1){
            cacheYear[year].push( month );
          }          
        }
      }else{
        for(let i= this.start_year; i> this.start_year - 10;i--){
          rs.push( i );
        }
      }
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
    matchDay(year,month,day){
      let str = [year, month.toString().padStart(2,'0') ,day.toString().padStart(2,'0')].join('-');
      if( this.cacheLog[ str]){
        return true;
      }else{
        return false;
      }
    },
    matchMonth( year, month ){
      //return Array.from({length:12}, (v,k) => k+1);
      let cache = this.cacheYear[year] || [];
      return cache;
    },
    daysHeight(year){
      let cache = this.cacheYear[year]||[]
      let len = cache.length;
      let offset = Math.ceil((len-1) /5) * 20;
      let idx = -1;
      if( year == this.currentYear ){
        let month = this.currentMonth;
        idx = cache.indexOf( month );
        if( idx >=4){
          offset +=20;
        }
        console.log("当前：",year, "idx", idx,"占："+ (offset/20)+"行")
        return 130 + offset
      }
      return 0;
    },
    onExpandMonth(year,month, mount=false){
      this.animateDayDelay = '0s';
      this.currentYear = year;
      this.currentMonth = this.getNearMonth( year, month );
      
      this.expandMonth = true;

      console.log("onExpandMonth", year,month)
      let maxday = new Date(year, month, 0).getDate();
      let days = Array.from({length:maxday}, (v,k) => k+1);
      this.days = days;

      this.query.year = this.currentYear;
      this.query.month = this.currentMonth;
      if( !mount ){
        this.$router.push({path:'/', query:this.query})
      }
      
    },
    onExpandYear(year){
      this.animateDayDelay = '0.5s';
      this.currentYear = year;
      this.currentMonth = this.getNearMonth( year, 1 );
      this.expandMonth = true;
      console.log("当前月", this.currentMonth)
      
      this.query.year = this.currentYear;
      delete this.query.month;
      this.$router.push({path:'/', query:this.query})
    },
    getNearMonth( year, month ){
      let cacheMonths = this.cacheYear[year] || [];
      let rs = month;
      if( cacheMonths.indexOf(month) ==-1){
        rs = cacheMonths[0] || month;
      }
      console.log("最近的月", this.currentMonth)
      return rs;
    },
    onShowMore(){
      this.showmore = true;
    }
  },
  beforeUpdate(){    
  },
  watch:{
    '$route':function(route){
      this.query = {...route.query};
      console.log("查询器", this.query)
    }
  },
  updated(){
  },
  mounted(){
    this.onExpandMonth(this.currentYear, this.currentMonth, true)
    this.query = this.$router.query || {};
  }
};
</script>
<style lang="less" scoped>
	.mod-datenav{
    
    .year-title, .month-title{
      cursor: pointer;
      color: #666;
      font-size: 14px;
      height: 20*@rem;
      line-height: 20*@rem;
      text-align: left;
    }
    .year-item{
      .month{
        height: 0;
        overflow: hidden;
      }
    }
    .year-item-show{
      .year-title{
        color:#409EFF;
      }
      .month{
        height: 190px;
      }
    }
    .year-title{
      font-weight: bold;
    }
    .month-item{
      height: 18*@rem;
      line-height: 18*@rem;
      overflow: hidden;
      display: inline-block;
      float: left;
      margin-right: 5*@rem;
      .day{
        height: 0;
        width: 0;
        overflow: hidden;
      }
      .month-title{
        display: inline-block;
      }
    }
    .month-item-show{
      height: auto;
      margin-right: 0;
      .day{
        height: 100px;
        width: auto;
      }
    }

    /** ani */
    .month{
      .transition(all,0.5s,ease,0s);
    }
    .day{
      .transition(all,0.5s,ease,0.5s);
    }
    /** ani end */
    .month-expand{      
      .month-item-show{
        width: 100%;
      }
    }

    .year,.month,.day{
      text-align: left;
    }
    .day{
      opacity: 0;
    }
    .day-item{
      display: inline-block;
      border: 1px solid #EEE;
      width: 0;
      height: 0;
      overflow: hidden;
      position: relative;
    }
    .day-item i{
      position: relative;
      width: 100%;
      height: 100%;
      display: block;
    }
    .day-item-matched i:after{
      content:"";
      position: absolute;
      width: 0px;
      height: 0px;
      right: 0;
      top:0;

      border-width: 3*@rem;
      border-style: solid;
      border-color: #49a2ff #49a2ff transparent transparent ;
    }
    .day-show{
      opacity: 1;
      .day-item{
        box-sizing:border-box;
        font-style: normal;
        text-align: center;
        width: 12.5%; /** 100/7 **/
        height: 18*@rem;
        margin-right: 2px;
        margin-bottom: 2px;
        float: left;
      }
    }

    .years{
      overflow: hidden;
      height: 250*@rem;
    }
    .years-expand{
      overflow: visible;
      height: auto;
    }
    .more{
      text-align: right;
    }
  }
</style>