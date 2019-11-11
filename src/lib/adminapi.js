import { stringify } from 'qs';
import request from '@/lib/request';

let catcher = function( func, params, context ){
	return new Promise((resolve,reject)=>{
		func( params ).then( res =>{
			resolve( res );	
		}).catch(e=>{
			context.$message.error(e+"");
		})
	})
}
/**
 * @param {object} params - 参数集
 * @param {Vue} context - 接口的上下文对象
 */
export async function article_modify( params , context = null ){
	if( context ){
		return catcher( article_modify, params, context );
	}
	return request.post(`/api/admin/article/modify?${stringify(params)}` );
}


