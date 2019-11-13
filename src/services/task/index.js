import { stringify } from 'qs';
import request from '@/lib/request';
import cacher from '@/services/cacher'

const host = "http://php.tt.com";
export async function list( params ) {
  	return request.get(`${host}/index.php/ajax/task/?${stringify(params)}`);
}


export async function info( params, context = null ) {
	if( context ) return cacher( info, params, context );
	return request.get(`${host}/index.php/ajax/task/info/?${stringify(params)}`);
}

export async function info_status (params) {
	return request.get(`${host}/index.php/ajax/task/info_status/?${stringify(params)}`);
}

export async function update( option, context = null ){
	if( context ) return cacher( update, option, context );
	return request.post(`${host}/index.php/ajax/task/update/?${stringify(option.params)}`, option );
}

export async function modify( params ){
	return request.get(`/api/article/modify?${stringify(params)}`);
}

export async function run( params ){
	return request.get(`${host}/index.php/ajax/task/run/?${stringify(params)}`);
}

export default {
	list,info,info_status,update,run
}