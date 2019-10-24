import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import Article from '@/components/Article';
import NotFound from '@/components/NotFound';
import Element from '@/components/Element';



Vue.use(Router);

console.log("Article", Article)
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
		component: Article,
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
