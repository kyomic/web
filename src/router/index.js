import Vue from 'vue';
import Router from 'vue-router';
//index去控制管理或web首页
import index from '@/pages/index';
import article from '@/pages/article/article';
import article_detail from '@/pages/article/article_detail';

import login from '@/pages/account/login';
import {info as userinfo} from '@/pages/account/info'
import search from '@/pages/search/search'

import { admin_index, admin_article, admin_article_edit } from '@/pages/admin';
console.log("admin_article", admin_index)

import NotFound from '@/components/NotFound';
import Element from '@/components/Element';



Vue.use(Router);

console.log("Article", article)
console.log("Element", Element)
let routerOptions = {
	//mode:"history", 
	routes:[]
}

let webRouter = [
	{
		path: '/',
		name: 'home',
		component: index,
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
	}
];
routerOptions.routes = routerOptions.routes.concat( webRouter );
routerOptions.routes = routerOptions.routes.concat( adminRouter );
export default new Router( routerOptions );
