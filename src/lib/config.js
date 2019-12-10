let config = {};
config.apiMock = "";
config.staticPath = "";

let env = process.env.NODE_ENV;
config.routerMode = 'hash' //hash

config.host = {
	www:"http://www.shareme.cn",
	admin:"http://admin.shareme.cn",
	static:"http://www.shareme.cn",
	api:"http://api.shareme.cn",
	report:"http://api.shareme.cn",
}
config.api = config.host.api;

if( (/localhost|\d+\.\d+\.\d+\.\d+/i).exec(location.host)){
	config.host.www = [location.protocol,"//",location.host].join('');
}

switch( env ){
	case 'development':
		config.routerMode = 'hash'
		break;
	case 'testing':
	case 'production':
		config.api = "http://api.shareme.cn";
		config.routerMode = 'history'
		break;
}



config.env = env;
config.dev = env == 'development';
config.user = {};
config.user.user_id = '';
config.user.token = '';
export default config;