import request from '@/lib/request';
import { api } from '@/services/api';
let api_article = api.article;

// initial state
// shape: [{ id, quantity }]
const state = {
    list: {
        data: [],
        pagination: {}
    },
    scrollTop:0,
    currentArticle:{},
}


// getters
const getters = {
    list: function(state) {
        return state.list
    },
    scrollTop(state){
        return state.scrollTop
    }
}


// actions
const actions = {
    async nextPage({dispatch}) {
        return dispatch('list', {
            page: 1
        })
    },
    async getArticle({state, commit}, payload ){
        let data = await getArticleById( payload );
        //state.currentArticle = data;
        commit('showArticle', data );
    },

    async list({ state, commit, dispatch }, payload) {
        let data = await api_article.list(payload);
        commit('append', data);
        return data;
    }, 


}

// mutations
const mutations = {
    updateScroll( state, payload ){
        state.scrollTop = payload;
    },
    append(state, payload) {
        state.list = {
            data: state.list.data.concat(payload.list || []),
            pagination: {...payload.pagination }
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