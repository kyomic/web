let Debug = {}
let root = null;
let wrapper = null;
Debug.getRoot = ()=>{
	if( !root ){
		root = document.querySelector(".debugger");
		if( !root ){
			root = document.querySelector(".page-wrap");
			let dom = document.createElement('div');
			dom.className = 'debugger';
			dom.innerHTML = "<div class='content'></div>"
			root.appendChild( dom );
			root = document.querySelector(".debugger");
		}
	}
	if( !wrapper ){
		wrapper = root.querySelector('.content');
	}
	return wrapper;
}
Debug.print = function( ...args ){
	let root = Debug.getRoot();
	if( root ){
		let arr = Array.from( args );
		root.innerHTML += arr.reduce((current,value)=>{
			return current +'<br />' + value;
		},'')
	}
}
Debug.console = (...args)=>{
	Debug.print( args );
}
export default Debug;