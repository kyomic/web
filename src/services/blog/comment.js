import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'
import config from '@/lib/config';

export async function list( params, context = null ) {
	if( context ) return cacher( list, params, context );
  	return request.get(`${config.api}/ajax/comment/?${stringify(params)}`);
}

/** 
 * 博客文章单篇信息
 * @param {Object} - params  参数:{id}
 * @param {Vue} - context Vue的上下文
 * @return {Promise}
 */
export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/comment/info/?${stringify(params)}`);
}

export async function update( params, context = null ) {
	if( context ) return cacher( update, params, context );
	return request.get(`${config.api}/ajax/comment/update/?${stringify(params)}`);
}

export async function remove( params, context = null ){
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/comment/remove/?${stringify(params)}`);
}


export default {
	list,info,remove,update
}