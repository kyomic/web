import request from '@/lib/request';
import {
    getArticleList, getArticleById 
}
from '@/lib/api';

// initial state
// shape: [{ id, quantity }]
const state = {
    loading: true,
    list: {
        data: [],
        pagination: {}
    },
    currentArticle:{},
}


// getters
const getters = {
    list: function(state) {
        console.log("getter. ", state.list)
        return state.list
    }
}


// actions
const actions = {
    async nextPage({dispatch}) {
        return dispatch('getList', {
            page: 1
        })
    },
    async getArticle({state, commit}, payload ){
        let data = await getArticleById( payload );
        //state.currentArticle = data;
        commit('showArticle', data );
    },

    async getList({ state, commit, dispatch }, payload) {
        state.loading = true;
        let data = await getArticleList(payload);
        state.loading = false;        
        commit('appendArticle', data);
        return data;
    }, 


}

// mutations
const mutations = {
    appendArticle(state, payload) {
        console.log("添加文章 ", payload)
        state.list = {
            data: state.list.data.concat(payload.list || []),
            pagination: {...payload.pagination
            }
        }
        console.log("state", state)
    },

    showArticle(state, payload){
        state.currentArticle = payload;
    },

    mutationsCall(state, payload) {
        console.log("app.mutations.mutationsCall:");
    },

    showSearch(state, bol) {
        state.shown = bol;
    }
}

export
default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}