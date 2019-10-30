import { stringify } from 'qs';
import request from '@/lib/request';
// 查询文章数据
export async function getArticleList(params) {
  	return request.get(`/api/article/list?${stringify(params)}`);
}

export async function getArticleById(params){
	return request.get(`/api/article/detail?${stringify(params)}`);
}