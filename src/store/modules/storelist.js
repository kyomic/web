class StoreList{
	static getInstance(){
		if( !StoreList.instance ){
			StoreList.instance = new StoreList();
		}
		return StoreList.instance();
	}
	static create( api ){
		let state = {
			list: {
		        data: [],
		        pagination: {}
		    },
		    detail:{}, //详情
		    loading:false,
		    currentPage:0,
		    pagestate:{}, //当前页处理状态

		    cachepage:{}, //cache
		    cacheinfo:{}, //详情
		    scrollTop:0,
		}

		let getters = {}

		let actions = {
			async reload({state,dispatch}, payload ){
				state.currentPage = 0;
				state.cachepage = {};
				state.list = {data:[],pagination:{}};
				return dispatch('nextPage', payload );
			},
			/**
			 * 下一页
			 */
			async nextPage({state,dispatch}, payload ) {
		        let page = 0;
		        let total = 0;
		        if( state.list && state.list.pagination && state.list.pagination.page ){
		            let pagination = state.list.pagination
		            page = pagination.page;
		            total= pagination.maxpage;
		        }
		        page = page + 1;
		        if( state.currentPage == 0){
		        	//删除时，重置当前页
		        	page = 1;
		        }
		        state.currentPage = page;
		        console.log("nextPage", page, total)
		        if( page <= total || page == 1){
		        	return dispatch('appendPage', {page, ...payload })
		        }   
		        
		    },

    		/**
    		 * 显示一页的数据
    		 */
		    async setPage({state, commit}, payload ){
		        state.currentPage = payload.page;
		        let cache = state.cachepage[payload.page];
		        if( cache ){
		            commit('display', cache );
		        }else{
		            let data = await api.list(payload);
		            state.cachepage[ payload.page ] = data;
		            commit('display', data );
		        }
		    },

		    async appendPage({state,commit}, payload ){
		    	let s = state.pagestate[ payload.page ];
		    	if( typeof s != 'undefined'){
		    		return;
		    	}
		    	state.pagestate[payload.page] = 2;

		    	state.loading = true;
		    	console.log("添加页",payload)
		    	let data = await api.list(payload);

		    	state.pagestate[payload.page] = 1;
		    	state.loading = false;		    			    	
        		commit('append', data)
		    },

		    async info({state, commit}, payload ){
		    	state.loading = true;
		    	let data = state.cacheinfo[ payload.id ];
		    	if( !data ){
		    		state.detail = {}
		    		data = await api.info( payload );
		    		state.cacheinfo[ payload.id ] = data;
		    	}
		    	state.detail = {...data}
		    	state.loading = false;
		    	return data;
		    },

		    async removeByIds({state,commit}, payload ){
		    	let data = await api.remove( payload );
		    	console.log("remove", payload)
		    	commit('remove', payload );

		    }
		}

		let mutations = {
		    updateScroll( state, payload ){
		        state.scrollTop = payload;
		    },

		    setCurrentPage( state, payload ){
		    	state.currentPage = payload;
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
		        let data = payload.list||[];
		        /*
		        data = data.map(res=>{
		        	res.checked = false;
		        	return res;
		        })
*/
		        state.list = {
		            data: state.list.data.concat(data),
		            pagination: {...payload.pagination }
		        }
		    },
		    checkall( state, payload ){
		    	let list = state.list.data.concat();
		    	list = list.map( res=> {res.checked = payload ;return res;} )
		    	state.list = {
		    		...state.list, data:list
		    	}
		    },

		    remove( state, payload ){
		    	let ids = payload.ids+'';
		    	let arr = ids.split(",").map(res=> parseInt(res+""));
		    	state.list.data = state.list.data.filter(res=>{
		    		return arr.indexOf( parseInt(res.id+"")) ==-1;
		    	})
		    	state.cachepage = {};
		    	state.list = state.list;
		    },
		    /** 修改 **/
		    update(state, payload){
		        state.list.data = state.list.data.map(res=>{
		            if( res.id == payload.id ){
		                for(var i in payload ){
		                    res[i] = payload[i];
		                }
		                return res;
		            }else{
		                return res;
		            }
		        })
		        console.log("更新", payload, state.list.data)
		    },
		    updateInfo( state, payload ){
		    	let data = state.cacheinfo[ payload.id ];
		    	for(var i in payload ){
		    		data[i] = payload[i];
		    	}
		    	state.detail = {...data}
		    }
		}

		return {
			state,
			getters, 
			actions,
			mutations
		}
	}
}


export default StoreList;
export { StoreList };