// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './admin.vue';
import VueMeta from 'vue-meta'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

import {
  Row,Col,Button,Input,Notification,Message, Drawer, Form, FormItem,
  Table, TableColumn
} from 'element-ui'  //按需引用element-ui组件

import router from './router';
import store from './store'

import './assets/style.scss'
import './assets/normalize.css'
import 'element-ui/lib/theme-chalk/display.css';
import './lib/rem.js'
import './assets/model.less';
import './pages/admin/admin.less';

//将element组件内容挂载到Vue上
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(Input);
Vue.use(Form);
Vue.use(FormItem)
Vue.use(Drawer);
Vue.use(Table);
Vue.use(TableColumn);

Vue.use(VueMeta)

//没看懂
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;

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
  next();
});