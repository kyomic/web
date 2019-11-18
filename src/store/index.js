import Vue from 'vue';
import Vuex from 'vuex';

import env from './base/env'
import user from './modules/user'
import search from './modules/search'
import blog from './modules/blog'

import admin_article from "./modules/admin/article";
import admin_task from "./modules/admin/task";
import admin_figure from "./modules/admin/figure"


Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
  	env,
  	user,
  	search,
  	blog,


  	admin_article,
  	admin_task,
  	admin_figure
  }
});
 
export default store;