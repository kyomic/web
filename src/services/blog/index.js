import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'
import config from '@/lib/config';
export async function list( params ) {
  	return request.get(`${config.api}/ajax/blog/?${stringify(params)}`);
}

/** 
 * 博客文章单篇信息
 * @param {Object} - params  参数:{id}
 * @param {Vue} - context Vue的上下文
 * @return {Promise}
 */
export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/blog/info/?${stringify(params)}`);
}


export async function update( option, context = null ){
	if( context ) return cacher( update, option, context );
	return request.post(`${config.api}/ajax/blog/update/?${stringify(option.params)}`, option );
}

export default {
	list,info,update
}