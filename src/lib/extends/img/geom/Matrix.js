class Matrix{
	constructor( arr = null ){
		if( !arr ){
			arr = [[0,0,0],[0,0,0],[0,0,0]]
		}
		this._width = 0;
		this._height = 0;
		this.matrix = arr;
	}
	_validate( arr ){
		if( !arr || !arr.length ){
			throw new Error("matrix 长度不正确");
		}
		let len = arr.length;
		let sublen = 0;
		for( let i=0;i<len;i++){
			if( !sublen ){
				sublen =arr[i].length;
			}else{
				if( arr[i].length != sublen ){
					throw new Error("matrix 项长度不一致")
				}
			}
		}
	}
	set matrix( arr ){
		this._validate( arr );
		this._matrix = arr;
		this._height = this._matrix.length;
		this._width = this._matrix[0].length;
	}

	get matrix(){
		return this._matrix;
	}

	get width(){
		return this._width
	}
	get height(){
		return this._height
	}

	empty(){
		for(var i=0;i<this.height;i++){
			for(var j=0;j<this.width;j++){
				this._matrix[i][j] = 0;
			}
		}
	}
	/** 
	 * 矩阵乘法
	 * @param {Matrix} m - 矩阵对象
	 * @example
	 * [1,2,3] * [1,1] => [1*1+1*2+1*3,2*1+2*2+2*3,3*1+3*2+3*3]
	 * [4,5,6]   [2,2]    [4*1+4*2+4*3,5*1+5*2+5*3,6*1+6*2+6*3]
	 *           [3,3]  
	 * @return {Matrix}  
	 */
	mutiply( m ){
		if( !(m instanceof Matrix )){
			throw new Error("参数不正确")
		}
		if( m.width != this.height || m.height != this.width ){
			throw new Error("矩阵长宽不符")
		}
		let matrix = [];
		for( var i=0;i<this.height;i++){
			matrix[i] = [];
			for(var j=0;j<this.width;j++){
				let sum = 0;
				for(var k=0;k<m.height;k++){
					sum += this._matrix[i][j] * m.matrix[k][i];
				}
				matrix[i][j] = sum;
			}
		}
		this.matrix = matrix;
		return this;
	}

	/** 
	 * 矩阵转置
	 * @example
	 * [1,2,3] => [1,4]
	 * [4,5,6]    [2,5]
	 *            [3,6]
	 */
	transpose(){
		let matrix = [];
		for(let i=0;i< this._width;i++){
			matrix[i] = [];
			for(let j=0;j< this._height;j++){
				matrix[i][j] = this._matrix[j][i]
			}
		}
		this.matrix = matrix;
		return this;
	}

	clone(){
		let m = [];
		for(var i=0;i<this.height;i++){
			m[i] = this.matrix[i].concat();
		}
		return new Matrix( m )
	}

	valueOf(){
		return this._matrix.flat();
	}

	toString(){
		let res = [];
		for(var i=0;i<this._matrix.length;i++){
			res.push( this._matrix[i].join(","))
		}
		return res.join("\r\n")
	}
}

export {
	Matrix
}
export default Matrix;