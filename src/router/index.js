import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import article from '@/pages/article/article';
import article_detail from '@/pages/article/article_detail';

import login from '@/pages/account/login';
import {info as userinfo} from '@/pages/account/info'

import search from '@/pages/search/search'
console.log("search", search)

import NotFound from '@/components/NotFound';
import Element from '@/components/Element';



Vue.use(Router);

console.log("Article", article)
console.log("Element", Element)
export default new Router({
	//mode:"history",
	routes: [
	{
		path: '/',
		name: 'home',
		component: HelloWorld,
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
	],
});
