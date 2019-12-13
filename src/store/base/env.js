// initial state
// shape: [{ id, quantity }]
import config from '@/lib/config';
let host = config.host;

const state = {
  grid24code:"",
  scrolling:false,
  router:{},
  host
}


// getters
const getters = {
  mobile: function (state) {
    //xs <768 屏幕宽
    return state.grid24code.indexOf("xs") != -1;
  }
}


// actions
const actions = {
  /**
    state,访问局部state
   */
  actionCall({ state,rootState,commit,dispatch, getters,rootGetters }, data ){
    
  }
  
}

// mutations
const mutations = {
  setGrid24( state, payload ){
    state.grid24code = payload;
  },
  scrolling( state, payload ){
    state.scrolling = payload;
  },
  updateRouter( state, payload ){    
    state.router = {
      ...payload,
      current:payload.to
    }
    debug && console.log("更新路由:", state.router )
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
