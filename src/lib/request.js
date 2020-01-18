//import axios from 'axios'
let axios = require('axios');
let qs = require('qs');
import config from './config'
//import qs from 'qs';


axios.defaults.withCredentials=true;
let CancelToken = axios.CancelToken;
let request = {};
request.cancel = function(){}
request.get = ( url, option ) =>{
	if( !/https?/ig.exec(url)){
		url = config.api + url;
	}
	if( /mp4/i.exec(url)){
		axios.defaults.withCredentials=false;
	}
	let params = Object.assign({}, option);
	params = Object.assign({}, params );
	params.url = url;
	params.method = 'get'
	//see https://www.jianshu.com/p/22b49e6ad819
	params.cancelToken = new CancelToken(function executor(c) {
	    request.cancel = c
	    //console.log(c)
	    // 这个参数 c 就是CancelToken构造函数里面自带的取消请求的函数，这里把该函数当参数用
	});

	return new Promise((resolve,reject)=>{
		axios( params ).then(res=>{
			setTimeout(()=>{
				if( res && res.data ){
					if( typeof res.data == 'object' && res.data.status == 200 ){
						resolve( res.data.data );
					}else{
						resolve( res.data );
					}
				}else{
					reject( res );
				}
			},1000);
		}).catch(e=>{
			reject(e);
		})
	});
	return axios.get( url, {
		params: params
	})
}
request.post = ( url, option ) =>{
	if( !/https?/ig.exec(url)){
		url = config.api + url;
	}
	option = option || {};
	return new Promise((resolve,reject)=>{
		axios.post( url, option.data ).then(res=>{
			if( res && res.data && res.data.status == 200 ){
				resolve( res.data.data );
			}else{
				reject( res );
			}
		}).catch(e=>{
			reject(e);
		})
	});
	return axios.get( url, {
		params: params
	})
}
request.upload = ( url, option ) =>{
	if( !/https?/ig.exec(url)){
		url = config.api + url;
	}
	option = option || {};
	return new Promise((resolve,reject)=>{
		axios.post( `${url}?${qs.stringify(option.params)}`, null, {data:option.data} ).then(res=>{
			setTimeout(()=>{
				if( res && res.data && res.data.status == 200 ){
					resolve( res.data.data );
				}else{
					reject( res );
				}
			},1000);
		}).catch(e=>{
			reject(e);
		})
	});
	return axios.get( url, {
		params: params
	})
}

export { request }
export default request;
