// initial state
// shape: [{ id, quantity }]
const state = {
  grid24code:""
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
  mutationsCall( state, payload ){
    console.log("app.mutations.mutationsCall:", data);
  },

  showSearch( state, bol ){
    state.shown = bol;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
