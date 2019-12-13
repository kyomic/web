// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
window.debug = true;
const Vue = require('vue');
import App from './App';
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'


let {Row,Col,Button,Input,Notification,Message, Drawer, Form, FormItem} = require('element-ui')  //按需引用element-ui组件

import config from '@/lib/config'
import utils from '@/lib/core/utils'
import router from './router';
import store from './store'
import reporter from '@/lib/reporter'

import Devices from '@/lib/core/Devices';
import DevicesType from '@/lib/core/consts/DevicesType';
import dom from '@/lib/core/dom'

import './assets/style.scss'

import './assets/model.less';
import './assets/common.less';

import './assets/normalize.css'
import 'element-ui/lib/theme-chalk/display.css';
import './lib/rem.js'

let hljs = require("highlight.js");

//将element组件内容挂载到Vue上
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(Input);
Vue.use(Form);
Vue.use(FormItem)
Vue.use(Drawer);


//没看懂
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;
Vue.prototype.$error = ( str )=>{
  Message({message:str,type:'error'})
}

Vue.prototype.$animate = function(){
  let tr = document.querySelectorAll(".article-item");
  tr = Array.from(tr);
  tr.map((res,i)=>{
    if( !dom.hasClass(res,'article-item-show')){
      dom.addClass(res,'article-item-show')         
    }
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

Vue.prototype.$updateTitle = function( str ){
  document.title = str;
}



Vue.prototype.$highlight = function( dom ){
  let contents = dom.querySelectorAll(".article-content .content");
  contents = Array.from( contents )||[];
  contents.map( res =>{
    let code = res.innerHTML;
    if( /(\[code\])|(\[html\])/ig.exec(code)){
      code = code.replace(/\[code\]([\s|\S]+)\[\/code\]/ig,"<pre class='hljs'><code class='javascript'>$1</code></pre>");
      code = code.replace(/\[html\]([\s|\S]+)\[\/html\]/ig,"<pre class='hljs'><code class='html'>$1</code></pre>");
      /*code = code.replace(/\[html\]([\s|\S]+)\[\/html\]/ig, function( match0, match1, index, source ){
        return "<pre class='hljs'><code class='html'>" + ( match1 ) + "</code></pre>";
      })*/

      res.innerHTML = code;

      let editors = res.querySelectorAll(".hljs code");
      editors = Array.from( editors ).map( hlsdom  =>{
        //hljs.configure({useBR: true});
        hljs.highlightBlock( hlsdom );
        //res.innerHTML = text;
      });
    }
  })
}

Vue.prototype.$preview = function( text ){
  let img_regx = /\[img\]([^\]]+)\[\/img\]/ig;

  let urls = [];
  while( true ){
    var res = img_regx.exec( text );
    if( res && res.length ){
      urls.push( res[1 ]);
    }else{
      break;
    }
  }

  img_regx = /<img[^s+]src\=['"]([^"']+)['"]>/ig;
  while( true ){
    var res = img_regx.exec( text );
    if( res && res.length ){
      urls.push( res[1 ]);
    }else{
      break;
    }
  }
  debug && console.log("imgs", urls)
  /*
  $host = "http://api.shareme.cn/blog_attachment/?id=";
  $host_home = "http://www.shareme.cn/";
  //[img]download.asp?id=210[/img]
  $str = preg_replace("/\[img\]download.asp\?id=(\d+)\[\/img\]/i", "<img src='$host$1'>", $str );
  $str = preg_replace("/\[img\]([^\]]+)\[\/img\]/i", "<img src='$host_home$1'>", $str );
  */
  if( urls.length ){
    urls = urls.map(res=>{
      res = res.replace(/download.asp\?id=(\d+)/ig, config.host.api + "/blog_attachment/?id=$1");
      return res;
    })
    if( Devices.getInstance().runtimeType == DevicesType.WX ){
      WeixinJSBridge && WeixinJSBridge.invoke("imagePreview",{
               "urls":urls,
               //"current":nowImgurl
            });
    }else{
      this.showviewer = true;
      this.previewImgs = urls;
    }
    
  }
}

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



/** 去更新store.env中的state */
router.beforeEach((to, from, next) => {
  //console.log(to.matched)
  debug && console.log("路由钩子:", store);
  debug && console.log( to, from ,next)
  if( to && to.name !='search'){
    store.commit('search/showSearch', false );
  }


  store.commit('env/updateRouter', {to, from});
  reporter.log('page', {
    url: [location.protocol, "//", location.host , to.fullPath].join('')
  });
  store.dispatch("user/session");
  next();
});