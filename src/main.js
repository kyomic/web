// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import VueMeta from 'vue-meta'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

import {Row,Col,Button,Input,Notification,Message, Drawer, Form, FormItem} from 'element-ui'  //按需引用element-ui组件

import router from './router';
import store from './store'

import './assets/style.scss'
import './assets/common.less';
import './assets/normalize.css'
import 'element-ui/lib/theme-chalk/display.css';
import './lib/rem.js'

//将element组件内容挂载到Vue上
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(Input);
Vue.use(Form);
Vue.use(FormItem)
Vue.use(Drawer);

Vue.use(VueMeta)

//没看懂
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;


Vue.config.productionTip = false;



const requireComponent = require.context(
  // 其组件目录的相对路径
  './components',
  // 是否查询其子目录
  true,
  // 匹配基础组件文件名的正则表达式
  /[A-Z]\w+\.(vue|js)$/
)
/*
requireComponent.keys().forEach(fileName => {
  // 获取组件配置
  const componentConfig = requireComponent(fileName)
  console.log("组件配置：", componentConfig)
  // 获取组件的 PascalCase 命名
  const componentName = upperFirst(
    camelCase(
      // 获取和目录深度无关的文件名
      fileName
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
    )
  )
  console.log("组件名:", componentName, fileName)

  // 全局注册组件
  Vue.component(
    componentName,
    // 如果这个组件选项是通过 `export default` 导出的，
    // 那么就会优先使用 `.default`，
    // 否则回退到使用模块的根。
    componentConfig.default || componentConfig
  )
})
*/
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});

Vue.prototype.$network = function(e){
  let msg = e.data ? (e.data.msg||'未知错误') : e;
  this.$message({
    message:( msg +""),
    showClose:true,
    duration:0,
    type:'error'
  })
}
Vue.prototype.$updateTitle = function( str ){
  document.title = str;
}
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