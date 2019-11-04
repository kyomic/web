import { stringify } from 'qs';
import request from '@/lib/request';
// 查询文章数据
export async function getArticleList(params) {
  	return request.get(`/api/article/list?${stringify(params)}`);
}

export async function getArticleById(params){
	return request.get(`/api/article/detail?${stringify(params)}`);
}

export async function search( params ){
	return request.get(`/api/search/?${stringify(params)}`);
}

export async function syncinfo( params ){
	return request.get(`/api/user/info`);
}
export async function login( params ){
	return request.get(`/api/user/login/?${stringify(params)}`);
}
export async function logout( params ){
	return request.get(`/api/search/?${stringify(params)}`);
}
export async function register( params ){
	return request.get(`/api/search/?${stringify(params)}`);
}
