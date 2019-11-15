import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'
import config from '@/lib/config';
export async function list( params ) {
  	return request.get(`${config.api}/ajax/blog/?${stringify(params)}`);
}


export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/blog/info/?${stringify(params)}`);
}

export async function update( option, context = null ){
	if( context ) return cacher( update, option, context );
	return request.post(`${config.api}/ajax/figure/update/?${stringify(option.params)}`, option );
}

export default {
	list,info,update
}