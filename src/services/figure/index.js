import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'

const host = "http://php.tt.com";
export async function list( params ) {
  	return request.get(`${host}/index.php/ajax/figure/?${stringify(params)}`);
}


export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${host}/index.php/ajax/figure/info/?${stringify(params)}`);
}

export async function update( option, context = null ){
	if( context ) return cacher( update, option, context );
	return request.post(`${host}/index.php/ajax/figure/update/?${stringify(option.params)}`, option );
}


export default {
	list,info,update
}