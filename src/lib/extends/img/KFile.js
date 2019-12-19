//let KAbstractFile = require('./KAbstractFile');
import KAbstractFile from './KAbstractFile';
class KFile extends KAbstractFile{
	constructor( source = null ){
		super( source );
	}

	createObjectURL( blob ){
		return URL.createObjectURL( blob );
	}
	/** 清除当前面的objectUrl **/
	revokeObjectURL( objectUrl ){
		return URL.revokeObjectURL( objectUrl );
	}

	get dataUrl(){
		return this._dataUrl;
	}

	read( content, type ='readAsDataURL' ){
		return new Promise((resolve,reject)=>{
			let fileReader = new FileReader()
	    	fileReader.onload = (e=>{
	    		let target = e.target;
	    		if( target.result ){
	    			this._dataUrl = target.result;
	    			resolve( target.result );
	    		}else{
	    			reject()
	    		}
	    	});
	    	fileReader.onerror = (e=>{
	    		reject(e);
	    	})
	    	console.log("read:", type)
	    	fileReader[type]( content )
		})
	}
}


export default KFile;
export {KFile};