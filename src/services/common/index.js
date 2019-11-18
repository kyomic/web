import request from '@/lib/request';
import { stringify } from 'qs';

export async function upload( option ){
	return request.upload(`/api/upload/`, option );
}

export async function init_cache( option ){
	return request.get(`/ajax/blog/init_cache`);
}
export default {
	upload, init_cache
}