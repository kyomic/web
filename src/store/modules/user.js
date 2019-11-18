// initial state
// shape: [{ id, quantity }]

import { api } from "@/services/api"
import store from '@/lib/core/store'

let user = api.user;
const state = {
  base:{},
  token:'',
  user_id:0,
  level:1
}


// getters
const getters = {
  myGetter: function (
    // 如果在模块中定义则为模块的局部状态
    state,
    // 等同于 store.getters
    getters,
    // 等同于 store.state
    rootState,
    // 所有 getters
    rootGetters) {
    return state.data
  },
  isLogined( state ){
    return state.user_id !=0 && state.token 
  },
  userinfo( state ){
    return {
      ...state, ...state.base
    }
  }
}


// actions
const actions = {
  /** 
   * 同步服务器登录态
   * @method
   */
  async loginstate({ state, commit }, payload ){
    let token = store.get('token');
    let user_id = store.get('user_id');
    let data = null;
    if( token ){
      data = {
        user_id, token
      }
    }else{
      data = await user.loginstate();
    }
    commit('updateUserInfo', data );
    return data;
  },

  async session(){
    let data = await user.session();
    console.log("会话状态", data );
  },
  
  async login({ state, commit, dispatch }, payload) {
    if( !payload ){
      return;
    }
    let data = await user.login(payload);
    commit('updateUserInfo', data );
    return data;
  }, 

  async logout({state, commit}){
    let data = await user.logout();
    commit('updateUserInfo',null);
    return data;
  }
  
}

// mutations
const mutations = {
  mutationsCall( state, payload ){
    console.log("app.mutations.mutationsCall:", data);
  },

  updateUserInfo( state, payload ){
    let token = '';
    let user_id = 0;
    if( payload ){
      token = payload.token;
      user_id = payload.user_id;

      store.set('user_id', user_id);
      store.set('token', token);
    }else{
      store.remove('user_id');
      store.remove('token');
    }

    state.token = token;
    state.user_id = user_id;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
