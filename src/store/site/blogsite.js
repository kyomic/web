// initial state
// shape: [{ id, quantity }]
import {api} from "@/services/api";
let { blogsite }  = api;

const state = {
  data:{
    cate:[],tags:[]
  }
}


// getters
const getters = {
  mobile: function (
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
  
  siteinfo(state){
    return state.data;
  }
}


// actions
const actions = {
  /**
    state,访问局部state
   */
  async info({ state,rootState,commit,dispatch, getters,rootGetters }, payload ){
    let data = await blogsite.info(payload);
    commit('update', data );
  }
  
}

// mutations
const mutations = {
  /** 修改 **/
  update(state, payload){
    console.log("udpate", payload)
    state.data = Object.assign( state.data, payload || {} );
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
