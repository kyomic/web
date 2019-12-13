// initial state
// shape: [{ id, quantity }]
import {api} from '@/services/api'
let {search} = api.common;

const state = {
  shown:true,

  loading:false,
  keyword:"",
  list: {
    data: [],
    pagination: {}
  },
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
  }
}


// actions
const actions = {
  /**
    state,访问局部state
   */
  actionCall({ state,rootState,commit,dispatch, getters,rootGetters }, data ){
    debug && console.log("app.actions.actionCall", data);
  },

  async query({ state, commit, dispatch }, payload) {
    debug && console.log("搜索：", payload)
    if( !payload ){
      return;
    }
    state.loading = true;
    let data = await search(payload);
    state.loading = false;
    state.keyword = payload.keyword;   
    commit('setArticle', data);
    return data;
  }, 
  
}

// mutations
const mutations = {
  mutationsCall( state, payload ){
    debug && console.log("app.mutations.mutationsCall:", data);
  },

  showSearch( state, bol ){
    state.shown = bol;
  },

  setArticle( state, payload ){
    state.list = {
      data: payload.list || [],
      pagination: {...payload.pagination}
    }
  },
  appendArticle( state, payload ){
    debug && console.log("添加文章 ", payload)
    state.list = {
      data: state.list.data.concat(payload.list || []),
      pagination: {...payload.pagination}
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
