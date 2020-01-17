export var getContext = function(){
	if( typeof window ==='undefined') return self;
	return window;
}