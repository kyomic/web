import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'
import config from '@/lib/config';
export async function list( params ) {
  	return request.get(`${config.api}/ajax/figure/?${stringify(params)}`);
}


export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/figure/info/?${stringify(params)}`);
}

export async function update( option, context = null ){
	if( context ) return cacher( update, option, context );
	return request.post(`${config.api}/ajax/figure/update/?${stringify(option.params)}`, option );
}

export async function make_thumbs( params, context = null ){
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/figure/make_thumbs/?${stringify(params)}`);
}
export async function update_figure( params, context = null ){
	if( context ) return cacher( info, params, context );
	return request.get(`${config.api}/ajax/figure/update_figure/?${stringify(params)}`);
}
export default {
	list,info,update, make_thumbs, update_figure
}