/**
 */
import Matrix from "./Matrix"

/**
 * [a, c, tx ]
 * [b, d, ty ]
 * [u, v, w  ]
 */
class Matrix2D extends Matrix{
	constructor( arr = null ){
		super( arr );
		this.matrix = [[1,0,0],[0,1,0], [0,0,1]];
	}

	translate( tx, ty ){
		this.tx = tx;
		this.ty = ty;
	}

	scale( sx, sy ){
		this.a = sx;
		this.d = sy;
	}

	rotate( angle ){
		this.a = Math.cos( angle );
		this.c = - Math.sin( angle );
		this.b = Math.sin( angle );
		this.d = Math.cos( angle );
	}

	skew( tx, ty ){
		this.c = Math.tan( tx );
		this.b = Math.tan( ty )
	}
	set a( value ){
		this._matrix[0][0] = value
	}
	set b( value ){
		this._matrix[1][0] = value
	}
	set c( value ){
		this._matrix[0][1] = value
	}
	set d( value ){
		this._matrix[1][1] = value
	}
	set tx( value ){
		this._matrix[0][2] = value
	}
	set ty( value ){
		this._matrix[1][2] = value
	}
}

export default Matrix2D;
export {
	Matrix2D
}