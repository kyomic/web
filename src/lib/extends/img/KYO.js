let instance = {}
let context = window;

let KYO = new Proxy( instance , {
	get( target, key ){
		if( target[key] ){
			return target[key];
		}else{
			return context[key];
		}
	},
	
	set( target, key, value ){
		if( key =='context'){
			context = value;
		}else{
			target[key] = value;
		}
	}
})
export default KYO;