import article from './article';
import task from "./task"
import figure from './figure'

import { figuresiteinfo } from './figure'

import blog from './blog'
import log from "./log"
import blogsite from './blogsite'
import user from './user'

import common from './common'
import blog_comment from './blog/comment';


let api = {
	article,task,figure,blog,blogsite,log, user,common, 

	figuresiteinfo,

	blog_comment
	
}

export default api;
export {api};