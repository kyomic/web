// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';

import {Row,Col,Button,Notification,Message} from 'element-ui'  //按需引用element-ui组件

import router from './router';

//将element组件内容挂载到Vue上
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);

//没看懂
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;


Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
});
