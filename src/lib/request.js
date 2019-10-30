import axios from 'axios'
import config from './config'

let request = {};
request.get = ( url, option ) =>{
	if( !/https?/ig.exec(url)){
		url = config.api + url;
	}
	let params = Object.assign({}, option);
	params = Object.assign({}, params );
	return new Promise((resolve,reject)=>{
		axios.get( url, {
			params: params
		}).then(res=>{
			setTimeout(()=>{
				if( res && res.data && res.data.status == 200 ){
					resolve( res.data.data );
				}else{
					reject( res );
				}
			},0);
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
