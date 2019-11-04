import Vue from 'vue';
import Vuex from 'vuex';

import env from './base/env'
import user from './modules/user'
import search from './modules/search'
import article from './modules/article'


Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
  	env,
  	user,
  	search,
  	article
  }
});
 
export default store;