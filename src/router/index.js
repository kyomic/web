//import Vue from 'vue';
//import Router from 'vue-router';
const Vue = require('vue');
const Router = require('vue-router');

//index去控制管理或web首页
import index from '@/pages/index';
import test from '@/pages/test'
import article from '@/pages/article/article';
import article_detail from '@/pages/article/article_detail';
import figure_detail from '@/pages/figure/figure_detail';

import login from '@/pages/account/login';
import logout from '@/pages/account/logout';

import {info as userinfo} from '@/pages/account/info'
import search from '@/pages/search/search'

import { 
	admin_index, admin_article, admin_article_edit,
	admin_settings,
	admin_task,admin_task_edit,
	admin_figure, admin_figure_edit,
	admin_log,
} from '@/pages/admin';

import {
	labs_index
} from '@/pages/labs';

import NotFound from '@/components/NotFound';
import Element from '@/components/Element';
import config from '@/lib/config';


Vue.use(Router);


let routerOptions = {
	mode:config.routerMode, 
	routes:[]
}

let webRouter = [
	{
		path: '/',
		name: 'home',
		component: article,
		meta: {
	        title: "HelloWorld",
	        show: true
	    }
	},
	{
		path: "/account/login",
		name:"account_login",
		component:login
	},
	{
		path: "/account/logout",
		name:"account_login",
		component:logout
	},
	{
		path: "/account/info",
		name:"account_info",
		component:userinfo
	},
	{
		path: "/article",
		name: "article",
		component: article
	},
	{
		path: "/article/detail",
		name: "article_detail",
		component:article_detail
	},
	{
		path: "/figure/detail",
		name: "figure_detail",
		component:figure_detail
	},
	{
		path: "/element",
		name: "element",
		component: Element,
	},
	{
		path: "/search",
		name: "search",
		component: search
	},
	{
		path: "/test",
		name: "test",
		component: test
	},
	{
		path:'*',
		name:'404',
		component:NotFound
	}
];
let adminRouter = [
	{
		path:"/admin.html",
		name:"admin_index",
		component:admin_index
	},
	{
		path:"/admin/index",
		name:"admin_index",
		component:admin_index,
	},
	{
		path:"/admin/article",
		name:"admin_article",
		component:admin_article,
	},
	{
		path:"/admin/article_edit",
		name:"admin_article_edit",
		component:admin_article_edit,
	},
	{
		path: "/admin/log",
		name: "admin_log",
		component:admin_log
	},
	{
		path:"/admin/article_detail",
		name:"article_detail",
		component:article_detail,
	},
	{
		path:"/admin/settings",
		name:"article_settings",
		component:admin_settings,
	},
	{
		path:"/admin/task",
		name:"admin_task",
		component:admin_task,
	},
	{
		path:"/admin/task_edit",
		name:"admin_task_edit",
		component:admin_task_edit,
	},
	{
		path:"/admin/figure",
		name:"admin_figure",
		component:admin_figure,
	},
	{
		path:"/admin/figure_edit",
		name:"admin_figure_edit",
		component:admin_figure_edit,
	}
];

let labsRouter = [
	{
		path:"/labs/index",
		name:"labs_index",
		component:labs_index
	}
];
let labs = require('@/pages/labs');
for(var i in labs.pages){
	labsRouter.push({
		path:"/labs/" + i, 
		name:"labs_" + i, 
		component: labs.pages[i].default,
		meta: {
	        title: labs.pages[i].default.title || ""
	    }
	})
}
routerOptions.routes = routerOptions.routes.concat( webRouter );
routerOptions.routes = routerOptions.routes.concat( adminRouter );
routerOptions.routes = routerOptions.routes.concat( labsRouter );
export default new Router( routerOptions );
