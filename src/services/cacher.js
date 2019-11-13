let catcher = function( func, params, context ){
	return new Promise((resolve,reject)=>{
		func( params ).then( res =>{
			resolve( res );	
		}).catch(e=>{
			let msg = e.data ? (e.data.msg||'未知错误') : e;
			context.onError && context.onError();
			context.$message.error( msg +"");
		})
	})
}
export default catcher;