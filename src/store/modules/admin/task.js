import request from '@/lib/request';
import { api } from '@/services/api';
let task = api.task;

// initial state
// shape: [{ id, quantity }]
const state = {
    list: {
        data: [],
        pagination: {}
    },
    currentPage:0,
    cachepage:{}, //cache
    scrollTop:0,
}


// getters
const getters = {    
    scrollTop(state){
        return state.scrollTop
    }
}


let timeIntervals = {}

// actions
const actions = {
    async nextPage({state,dispatch}) {
        let page = 0;
        let total = 0;
        if( state.list && state.list.pagination && state.list.pagination.page ){
            let pagination = state.list.pagination
            page = pagination.page;
            total= pagination.maxpage;
        }
        page = page + 1;
        state.currentPage = page;
        if( page <= total || page == 1){
            return dispatch('list', {
                page
            })
        }       
        
    },
    
    async setPage({state, commit}, payload ){
        state.currentPage = payload.page;
        let cache = state.cachepage[payload.page];
        if( cache ){
            commit('display', cache );
        }else{
            let data = await task.list(payload);
            state.cachepage[ payload.page ] = data;
            commit('display', data );
        }
    },

   
    async update_status( {state, commit, dispatch} , payload ){
        let id = payload.id;
        if( payload.status == 2 ){
            //processing
            let timeoutId = timeIntervals[ id ];
            await new Promise((resolve)=>{
                timeoutId = setTimeout(()=>{
                    resolve( id );
                },1000)
            })
            let res = await task.info_status( {id:payload.id} );
            if( res ){
                commit('update', res );
            }
            dispatch('update_status', res );
        }        
    },   

    async start({ state, commit, dispatch }, payload ){
        let params = {id:payload.id, status:2} 
        //运行cmd
        await task.run( payload );

        let res = await task.update( {
            params:params, data:params
        } )
        res = {...res, ...payload };
        debug && console.log("开始", res)
        commit('update', res );
        dispatch('update_status', res );
        
    },

    async stop( { state, commit, dispatch }, payload ){
        if( timeIntervals[payload.id]){
            clearTimeout( timeIntervals[payload.id] )
        }
        let params = {id:payload.id, status:3} 
        let res = await task.update( {
            params:params, data:params
        } )
        commit('update', params );
    },

    async stopall({ state, dispatch }){
        let list = state.list.data || [];
        debug && console.log("停止全部", state)
        list.map(res=>{
            if( res.status == 2){
                console.log("停止", res)
                dispatch('stop', res)
            }
        })
        debug && console.log("停止全部", state)
    },

    async list({ state, commit, dispatch }, payload) {
        let data = await task.list(payload);

        data.list.map(res=>{
            dispatch('update_status', res );
        })
        commit('append', data);
        return data;
    }
    
}

// mutations
const mutations = {
    updateScroll( state, payload ){
        state.scrollTop = payload;
    },

    /** 显示 */
    display( state, payload ){
        state.list = {
            data: payload.list, 
            pagination: payload.pagination
        }
    },
    /** 追加 */
    append(state, payload) {
        let page = payload.pagination.page;
        if( state.cachepage[page]){
            return;
        }
        state.cachepage[page] = payload;

        
        state.list = {
            data: state.list.data.concat(payload.list || []),
            pagination: {...payload.pagination }
        }
    },

    /** 修改 **/
    update(state, payload){
        state.list.data = state.list.data.map(res=>{
            if( res.id == payload.id ){
                for(var i in res ){
                    if( payload[i] ){
                        res[i] = payload[i];
                    }
                }
                return res;
            }else{
                return res;
            }
        })
        debug && console.log("更新", payload)
    },
    mutationsCall(state, payload) {
        debug && console.log("app.mutations.mutationsCall:");
    },

    showSearch(state, bol) {
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