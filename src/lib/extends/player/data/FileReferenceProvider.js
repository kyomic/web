import { BufferProvider } from '../core/provider';

class FileReferenceProvider extends BufferProvider{
	static FileReferenceProviderOptions = {
		blockSize: 1024 * 512
	}
	constructor( option ){
		super( option );
		this.option = Object.assign( Object.assign({}, FileReferenceProvider.FileReferenceProviderOptions ), option );
		this._bytesTotal = 0;
		this._bytesStart = 0;
		this._blockSize = this.option.blockSize;
		this._index = 0;
		this.files = option.files|| [];
	}

	set files( value ){
		if( value && value.length ){
			this._files = value;
			this._file = this._files[0];
			this._bytesTotal = this._file.size;		
			this._blockSize = this._bytesTotal;	
			this.slice = this._file.slice || this._file.webkitSlice || this._file.mozSlice;
			setTimeout(_=>{
				this.trigger('load', { files: this._files, file: this._file } );
			},200)
		}
	}

	hasNext(){
		if( !this._file ){
			return false;
		}
		if( this._bytesStart >= this._bytesTotal ){
			return false;
		}
		return true;
	}

	next(){
		if( this.hasNext() ){			
			let start = this._bytesStart;
			let end = start + this._blockSize;
			if( end >= this._bytesTotal ) end = this._bytesTotal;
			let blob = this.slice.call( this._file, start, end );
			let reader = new FileReader();
			reader.onload = (e)=>{
				let buffer = new Uint8Array( reader.result );
				this.trigger( 'append' , {data: buffer, sn: this._index })
				this._bytesStart += (end - start)
				this._index += 1;
			}
			reader.readAsArrayBuffer( blob );
			
		}
	}
}
export {FileReferenceProvider}
export default FileReferenceProvider;