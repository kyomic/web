import Vue from 'vue';
import Vuex from 'vuex';

import env from './base/env'
import search from './modules/search'


Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
  	env,
  	search
  }
});
 
export default store;