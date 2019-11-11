import { stringify } from 'qs';
import request from '@/lib/request';

export async function list( params ) {
  	return request.get(`/api/article/list?${stringify(params)}`);
}
export async function modify( params ){
	return request.get(`/api/article/modify?${stringify(params)}`);
}
export default {
	list,modify
}