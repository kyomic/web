import Vue from 'vue';
//import Vuex from 'Vuex';
let Vuex = require('Vuex');

import env from './base/env'
import blogsite from './site/blogsite'
import figuresite from './site/figuresite'

import user from './modules/user'
import search from './modules/search'
import blog from './modules/blog'
import figure from './modules/figure'


import admin_article from "./modules/admin/article";
import admin_task from "./modules/admin/task";
import admin_figure from "./modules/admin/figure"
import admin_log from './modules/admin/log'

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
  	env,
  	blogsite, 
    figuresite,
  	user,
  	search,
  	blog,
    figure,


  	admin_article,
  	admin_task,
  	admin_figure,
  	admin_log,
  }
});
 
export default store;