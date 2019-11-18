import request from '@/lib/request';
import { stringify } from 'qs';

export async function loginstate( params ){
	return request.get(`/api/user/state`);
}
export async function login( params ){
	return request.get(`/ajax/user/login/?${stringify(params)}`);
}
export async function logout( params ){
	return request.get(`/ajax/user/logout/?${stringify(params)}`);
}
export async function register( params ){
	return request.get(`/api/search/?${stringify(params)}`);
}
export async function session (params) {
	return request.get(`/ajax/user/session/?${stringify(params)}`);
}

export default{
	loginstate,login,logout,register,session
}