// initial state
// shape: [{ id, quantity }]
const state = {
  grid24code:"",
  router:{}
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
    console.log("app.actions.actionCall", data);
  }
  
}

// mutations
const mutations = {
  setGrid24( state, payload ){
    state.grid24code = payload;
  },
  updateRouter( state, payload ){    
    state.router = {
      ...payload,
      current:payload.to
    }
    console.log("更新路由:", state.router )
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
