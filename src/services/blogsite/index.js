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
export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/blogsite/info/?${stringify(params)}`);
}


export default {
	info
}