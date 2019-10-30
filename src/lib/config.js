let config = {};
config.api = "http://localhost:3000";
let env = process.env.NODE_ENV;
switch( env ){
	case 'development':
		config.api = "";
		break;
	case 'testing':
	case 'production':
		config.api = "";
		break;
}

config.user = {};
config.user.user_id = '';
config.user.token = '';
export default config;