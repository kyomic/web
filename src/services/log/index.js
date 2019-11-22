import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'
import config from '@/lib/config';

/** 
 * 博客站点信息
 * @param {Object} - params  参数
 * @param {Vue} - context Vue的上下文
 * @return {Promise}
 */
export async function list( params, context = null ) {
	if( context ) return cacher( list, params, context );
	return request.get(`${config.api}/ajax/log/index/?${stringify(params)}`);
}

export async function info( params, context = null ) {
	if( context ) return cacher( list, params, context );
	return request.get(`${config.api}/ajax/log/info/?${stringify(params)}`);
}

export async function remove( params, context = null ){
	if( context ) return cacher( list, params, context );
	return request.get(`${config.api}/ajax/log/remove/?${stringify(params)}`);
}

export default {
	list,info,remove
}