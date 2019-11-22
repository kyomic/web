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
		    currentPage:0,
		    cachepage:{}, //cache
		    scrollTop:0,
		}

		let getters = {}

		let actions = {
			/**
			 * 下一页
			 */
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
		            dispatch('appendPage', {page})
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
		    	let data = await api.list(payload);
        		commit('append', data)
		    }

		}

		let mutations = {
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
		        console.log("更新", payload)
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