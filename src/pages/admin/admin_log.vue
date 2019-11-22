<template>
	<div class="page-wrap page-admin admin_log>">
		<div class="wrapper" ref="wrapper">
			<div :class="scrolling?'pagination-tip pagination-tip-show':'pagination-tip'">
				<div class="pagination-tip-wrap">
					<el-progress :text-inside="true" :stroke-width="14" :percentage="Math.floor(list.pagination.page/list.pagination.maxpage*100)" color='#A7A7A7'></el-progress>
					<span class="pagination-tip-label">{{Math.min(list.pagination.page*list.pagination.pagesize,list.pagination.total)}}/{{list.pagination.total}}</span>
				</div>
			</div>
			<KTable :data="tableData" :loading="loading" :mobile="mobile" v-slot:default="scope" @scroll.native="onWrapperScroll">
				<KTableColumn label="ID" :column="scope">
					<template v-slot:template>
						<input type="checkbox" @change="onCheckboxChange(scope, $event)" :checked="scope.checked" />
					</template>
				</KTableColumn>
				<KTableColumn label="状态" prop="coun_IP" :column="scope">
					<template v-slot:template>
						<div>{{scope.coun_IP}}<span style="float:right">{{scope.coun_Time}}</span></div>
						<div style="color:#ccc">
							{{scope.coun_OS}} {{scope.coun_Browser}}
						</div>
						<div class="log-detail">
							{{scope.coun_UA}}
						</div>
					</template>
				</KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">删除</el-button>
			        </template>
				</KTableColumn>
			</KTable>
		</div>
		<div class="form-bottom-option">
			<div class="wrap">
				<el-button size="small" type="primary" @click="onSelectAll" >全选</el-button>
				<el-button size="small" type="primary" @click="onSubmit" :disabled="checkedList.length?false:true" >删除所选</el-button>
			</div>
		</div>
	</div>
</template>

<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';
import ScrollView from '@/components/ScrollView'

import { api } from '@/services/api';
let blog = api.admin_log;
let {upload} = api.common;

let admin_log = {
	name: 'admin_log',
	components:{KTable,KTableColumn, ScrollView},
	data(){
		return {
			loading:true,
			isAllChecked:false,
			tableColumns:[1,2,3]
		}
	},
	computed:{
	  	//环境状态
	  	...mapState('admin_log',['list','scrollTop','currentPage']),
	    ...mapState('env', ['grid24code','router', 'scrolling']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),

	    checkedList(){
	    	if( this.list && this.list.data ){
	    		return this.list.data.filter(res=>{
					return res.checked == true;
				})
	    	}
	    	return []
	    },
	    tableData(){
	    	return this.list.data || [];
	    }
	},
	methods:{
		...mapActions('admin_log',['nextPage','removeByIds']),
		...mapMutations('admin_log',['updateScroll','update','checkall', 'setCurrentPage']),

		onCheckboxChange(scope, checked){
			if( typeof checked == 'object'){
				checked = checked.target.checked;
			}
			let data = {...scope, checked};
			this.update( data );
		},

		checkData(){
			if( this.list && this.list.data.length <=0 ){
				this.setCurrentPage( 0 );
				this.nextPage();
			}
		},

		onEditHandler(scope){
			let ids = {ids:scope.id};
			this.removeByIds(ids, this).then(res=>{
				this.checkData();
			})
		},
		onSelectAll(){
			this.isAllChecked = !this.isAllChecked;
			this.checkall( this.isAllChecked )
		},
		onSubmit(){
			let ids = this.checkedList.map(res=>{
				return res.id;
			})
			ids = ids.join(",");
			this.removeByIds({ids}, this ).then(res=>{
				this.checkData();
			})
			
		},
		onScroll(e){},
		onReachBottom(e){
			this.loading = true;
			this.nextPage();
		},
	},
	beforeDestroy(){
		if( this.onScrollHandler ){
			this.$root.$off('scroll',this.onScrollHandler )
			this.onScrollHandler = null;
		}
		if( this.onReachBottomHandler ){
			this.$root.$off('reachbottom',this.onReachBottomHandler )
		}
		
	},
	mounted(){
		console.log("tableData", this.list)
		if( !this.tableData || !this.tableData.length ){
			this.nextPage().then(res=>{
				if( this.list && this.list.pagination ){
		    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
		    			this.loading = false;
		    		}
		    	}
			}).catch(e=>{
				this.$network(e);
				setTimeout(_=>{
					this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
				},2000)
			});
		}else{
			//this.$el.querySelector(".mod-table").scrollTop = this.scrollTop;
		}
		this.$root.$onScroll = this.onScroll;
		this.$root.$onScrollBottom = this.onReachBottom;
		this.onScrollHandler = this.onScroll.bind(this);
		this.onReachBottomHandler = this.onReachBottom.bind(this);
		this.$root.$on('scroll',this.onScrollHandler )
		this.$root.$on('reachbottom',this.onReachBottomHandler )


		//this.$layoutTable();
	}
}
export {admin_log};
export default admin_log;
</script>
<style lang="less">
	.action{
		width: 100*@rem;
	}
	.mod-table{
		thead td:first-child{
			width:10*@rem;
		};
		thead td:last-child{
			width:45*@rem;
		};
	}
</style>