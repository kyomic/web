<template>
  <div :class="show?'mod-comment mod-comment-show':'mod-comment'" ref="comment">
    <div class="">
      <h4>评论 ({{commentLength}})条
        <el-button size="mini" type="primary" :style="{display:show?'none':'block','float':'right'}" @click.native="onShow">我要评论</el-button>
      </h4>
    </div>
    <div class="comment comment-input">
      <div class="comment-wrapper">
        <div class="avator">
          <img></img>
        </div>
        <div class="content">
          <el-input
            type="textarea"
            rows=3
            maxlength="100"
            placeholder="请输入内容"
            @keyup.native="onChange"
            v-model="comment">
          </el-input>
          <div class="captcha">
            
            <el-input
              autosize
               size="small"
              maxlength="4"
              placeholder="请输入图形码"
              v-model="code">
              <template slot="append">
                <img :src="captcha" @click="reloadCaptcha"></img>
              </template>
            </el-input>
            
          </div>
          <div class="comment-footer">     
            <span style="float:left;color:#ccc">点头像@TA</span>       
            <el-button size="mini"  type="primary"  @click.native="onPost" :disabled="charlen<=0?true:false">发表(<em>{{charlen}}</em>/100)</el-button>
          </div>
        </div>
      </div>

    </div>
    

    <div class="comment" v-for="(item) in list.data">
      <div class="avator" @click="onAtUser(item)">
        <img></img><span>{{item.comm_Author}}</span>        
      </div>
      <div class="content-wrapper">
        <div class="content">
          {{item.comm_Content}}
        </div>
        <div class="content-footer">
          <span class="date">日期:{{item.comm_PostTime}}</span>
        </div>
      </div>
      
    </div>
    <div class="loading-wrap">
      <i v-if="loading" class="el-icon-loading loading"></i>
      <span v-else class="no-comment">无更多评论 ~</span>
    </div>
  </div>
</template>
<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import config from '@/lib/config'
import dom from "@/lib/core/dom"

const {api} = require('@/services/api');
const comment = api.blog_comment;

export default {
  name: 'KComment',
  data() {
    return {
      comment:"",
      loading:true,
      fixscroll:false,
      charlen:100,

      captcha:"",//验证码图片地址
      code:"",//图形验证码
      show:false,//是否显示输入框
      page:0,

      list:{
        data:[]
      }
    };
  },
  props:{
    id:{
      type:Number, default:0, required:true
    }
  },
  computed:{
    //用户状态
    ...mapGetters('user',['isLogined', 'userinfo']),
    commentCls(){
      let arr = ['mod-comment'];
      if( this.show ){
        arr.push('mod-comment-show');
      }
      return arr.join(" ");
    },
    commentLength(){
      if( this.list && this.list.pagination ){
        return this.list.pagination.total;
      }
      return 0;
    }
  },
  methods:{
    onScroll( scrolldata ){
      return;
      let comment = this.$refs.comment;
      let offset = dom.position( comment );
      let headerHeight = document.querySelector(".header").offsetHeight;
      if( offset.top &&  (scrolldata.scrollTop + headerHeight - 100) > offset.top ){
        //this.fixscroll = true;
        dom.addClass( comment, 'mod-comment-fixed')
      }else{
        //this.fixscroll = false;
        dom.removeClass( comment, 'mod-comment-fixed')
      }
      debug && console.log("fixscroll", this.fixscroll, offset, (scrolldata.scrollTop ), headerHeight)
    },
    onReachBottom(){

    },
    onShow(){
      if(!this.isLogined ){
        this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
        return;
      }
      this.show = true;
    },
    onChange(){
      let regex = /[\u4E00-\u9FA5]/ig;
      //let str = this.comment.replace( regex, "00");
      let str = this.comment;
      let len = str.length;
      this.charlen = 100 - len;
    },
    onAtUser(data){
      this.comment += '@' + data.comm_Author;
    },
    onPost(e){
      if( !this.comment ){
        this.$error("请填写评论信息")
        return;
      }
      if( !this.code ){
        this.$error("请填写图形验证码")
        return;
      }
      comment.update({
        content: this.comment, 
        captcha: this.code,
        id: this.$route.query.id
      }).then( res=>{
        this.reloadCaptcha();
        this.list.data.unshift( res );
        this.comment = "";
        this.charlen = 100;
      }).catch(e=>{
        this.$network(e);
      })
      
    },
    reloadCaptcha(){
      this.captcha = config.host.api + "/ajax/common/captcha?rnd=" + Math.random();
    },


    hasNext(){
      if( this.list.pagination ){
        if( this.list.pagination.page >= this.list.pagination.maxpage ){
          return false;
        }
      }
      return true;
    },
    nextPage(){
      if( !this.hasNext()){
        this.loading = false;
        return;
      }
      this.page +=1;
      let id = this.$route.query.id;
      comment.list({id, "page":this.page}).then(res=>{      
        this.list = {
          data:res.list,
          pagination:res.pagination
        };

        if( !this.hasNext()){
          this.loading = false;
        }
      }).catch((e)=>{
        this.$network(e);
        this.loading = false;
      })
    }
  },
  beforeDestroy(){
    if( this.onScrollHandler ){
      this.$root.$off('scroll',this.onScrollHandler )
      this.onScrollHandler = null;
    }
    if( this.onReachBottomHandler ){
      this.$root.$off('reachbottom',this.onReachBottomHandler )
    }
    
  },
  mounted(){
    this.onScrollHandler = this.onScroll.bind(this);
    this.onReachBottomHandler = this.onReachBottom.bind(this);
    this.$root.$on('reachbottom' , this.onReachBottomHandler );
    this.$root.$on('scroll' , this.onScrollHandler );
    this.nextPage();
    this.reloadCaptcha();
  }
};
</script>
<style lang="less" scoped>
  .mod-comment{
    .comment{
      display: flex;
      display: -webkit-flex; /* Safari */
      flex-direction:row;
      align-content: flex-start;      
      margin-bottom: 10*@rem;
      line-height: 20*@rem;
      position: relative;
    }
    
    .avator{
      display: flex;
      flex:0 0 auto;
      margin-right: 10*@rem;
      width:45*@rem;
      flex-direction:column;
      justify-content:flex-start;
      align-items:center;
      img{
        border-radius: 50%;
        width: 32*@rem;
        height: 32*@rem;
        background-color: #F1F1F1;
        border:1px solid #ccc;
      }
    }
    .comment .content{
      display: flex;
      flex-direction:column;
      flex:1 1 auto;
      border:1px solid #e2e2e2;
      border-radius: 5*@rem;
      padding: 5*@rem;
      position: relative;
    }
    .content-footer{
      font-size: 9*@rem;
      color: #ccc;
    }
    

    .comment .content:before{
      content:"";
      display: block;
      width:0px;
      height: 0px;
      position: absolute;
      border-width: 5*@rem;
      border-style: solid;
      border-color: transparent #e2e2e2 transparent transparent ;
      left:-10*@rem;
    }
    .comment .content:after{
      content:"";
      display: block;
      width:0px;
      height: 0px;
      position: absolute;
      border-width: 5*@rem;
      border-style: solid;
      border-color: transparent white transparent transparent ;
      left:-9*@rem;
    }
    
    .captcha{
      display: flex; 
      flex-direction:row;
      justify-content:space-between;
      margin-top: 10*@rem;
      img{
        height: 26*@rem;
      }

      .el-input input[type=text]{
        border-right: none;
      }
    }
    .comment-input{
      padding-bottom: 10*@rem;
      .content{
        border:none;
        padding:0;
        &:before,&:after{
          display:none;
        }
      }
      .el-button{
        vertical-align: top;
      }
      .el-input-group__append{
        background:none;
        border-left: none;
      }
    }
    .comment-footer{
      text-align: right;
      margin-top: 5*@rem;
      em{
        font-style: normal;
        color: red;
      }
      button[disabled] em{
        color: #ccc;
      }
    }
  }

  .comment-wrapper{
    display: flex;
    display: -webkit-flex; /* Safari */
    flex-direction:row;
    width: 100%;
  }
  .mod-comment-fixed{
    .comment-input{
      position: fixed;
      top:40*@rem;
      left:0;
      z-index: 100;
      width: 100%;
      .comment-wrapper{
        background: white;
        width: 100%;
        padding: 10*@rem;
        padding-bottom: 10*@rem;
        box-shadow:0px 3px 6px rgba(0,0,0,0.1);
        width:100%;
      }
    }
    .comment-input + .comment{
      margin-top: 100*@rem;
    }

  }
  .mod-comment .comment-input{
    display: none;
  }
  .mod-comment-show .comment-input{
    display: flex;
  }
  .no-comment{
    display: inline-block;
    padding:30*@rem 0;
  }

  .loading-wrap{
    text-align: center;
    padding-bottom: 30*@rem;
  }
</style>