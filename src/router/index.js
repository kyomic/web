import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import article from '@/pages/article/article';
import article_detail from '@/pages/article/article_detail';

import NotFound from '@/components/NotFound';
import Element from '@/components/Element';



Vue.use(Router);

console.log("Article", article)
console.log("Element", Element)
export default new Router({
	mode:"history",
	routes: [
	{
		path: '/',
		name: 'HelloWorld',
		component: HelloWorld,
	},
	{
		path: "/article",
		name: "Article",
		component: article
	},
	{
		path: "/article/detail",
		name: "article_detail",
		component:article_detail
	},
	{
		path: "/element",
		name: "Element",
		component: Element,
	},
    {
    	path:'*',
    	name:'404',
    	component:NotFound
    }
	],
});
