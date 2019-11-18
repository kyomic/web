// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './admin.vue';
import VueMeta from 'vue-meta'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

import {
  Row,Col,Button,Notification,Message, Drawer, Form, FormItem,
  Progress,Pagination,Image,
  Table, TableColumn,Checkbox,CheckboxGroup,Radio,RadioGroup,Input,Select,Option,Switch,DatePicker,TimePicker,Tag
} from 'element-ui'  //按需引用element-ui组件

import router from './router';
import store from './store'
import Devices from '@/lib/core/Devices'

import './assets/style.scss'
import './assets/normalize.css'
import 'element-ui/lib/theme-chalk/display.css';
import './lib/rem.js'
import './assets/model.less';
import './pages/admin/admin.less';
import './assets/common.less';

//将element组件内容挂载到Vue上
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(Input);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Checkbox);
Vue.use(CheckboxGroup);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Select);
Vue.use(Option);
Vue.use(Progress);
Vue.use(Pagination);
Vue.use(Switch);
Vue.use(DatePicker);
Vue.use(TimePicker);
Vue.use(Tag);
Vue.use(Drawer);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Image)


Vue.use(VueMeta)

//没看懂
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;
Vue.prototype.$removeMessage = function(){
  let m = document.querySelectorAll('.el-message');
  Array.from(m).map(res=>{
    try{
      res.parentNode.removeChild( res );
    }catch(e){}
  })
}

Vue.prototype.$network = function(e){
  let msg = e.data ? (e.data.msg||'未知错误') : e;
  this.$message({
    message:( msg +""),
    showClose:true,
    duration:0,
    type:'error'
  })
}

Vue.prototype.$layoutTable = function(){
  let header = this.$root.$el.querySelector('.header');
  let headerHeight = 0;
  if( header ){
    headerHeight = header.offsetHeight;
  }
  let devices = Devices.getInstance();
  if( !devices.context ){
    devices.context = window;
  }
  if( devices.grid24code.indexOf("xs") == -1){
    //pc
    return ;
  }
  if( this.$refs["mod-table-header"] && this.$refs["mod-table"]){
    let height = this.$refs["mod-table-header"].offsetHeight;   

    let view = devices.viewSize;
    this.$refs["mod-table"].$el.style.cssText = "height:"+(view.height - height - headerHeight )+"px"
  }
}
Vue.prototype.$updateTitle = function( str ){
  document.title = str;
}

Vue.config.productionTip = false;



new Vue({
  el: '#admin',
  router,
  store,
  components: { App },
  template: '<App/>',
});

/** 去更新store.env中的state */
router.beforeEach((to, from, next) => {
  //console.log(to.matched)
  console.log("路由钩子:", store);
  console.log( to, from ,next)
  if( to && to.name !='search'){
    store.commit('search/showSearch', false );
  }
  store.commit('env/updateRouter', {to, from});
  store.dispatch("user/session");
  next();
  Vue.prototype.$removeMessage();
  
});