let catcher = function( func, params, context ){
	return new Promise((resolve,reject)=>{
		func( params ).then( res =>{
			resolve( res );	
		}).catch(e=>{
			let msg = e.data ? e.data.msg : e;
			context.onError && context.onError();
			context.$message.error( msg +"");
		})
	})
}
export default catcher;