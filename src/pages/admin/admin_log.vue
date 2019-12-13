<template>
	<div class="page-wrap page-admin admin_log>">
		<div class="wrapper" ref="wrapper">
			<div :class="scrolling?'pagination-tip pagination-tip-show':'pagination-tip'">
				<div class="pagination-tip-wrap">
					{{Math.min(list.pagination.page*list.pagination.pagesize,list.pagination.total)}}/{{list.pagination.total}}
				</div>
			</div>
			<div :class="formfilterOpened?'table-filter':'table-filter table-filter-min'" ref="filter">
				<i class="filter-extends el-icon-arrow-up" @click="onToggleFilterDisplay"></i>
				<el-form :inline="true" :model="formInline" class="demo-form-inline" size="mini">
				  <el-form-item label="键">
				    <el-input v-model="formfilter.key" prefix-icon="el-icon-search" size="mini" placeholder="关键词"></el-input>
				  </el-form-item>
				  <el-form-item v-if="!formfilterOpened">
				    <el-button type="primary" @click="onFormFilter" size="mini" >查询</el-button>
				  </el-form-item>
				  <el-form-item label="域">
				    <el-select v-model="formfilter.field" size="mini" placeholder="域">
				      <el-option label="IP" value="coun_IP"></el-option>
				      <el-option label="URL" value="coun_URL"></el-option>
				    </el-select>
				  </el-form-item>
				  <el-form-item>
				    <el-button type="primary" @click="onFormFilter" size="mini" >查询</el-button>
				  </el-form-item>
				</el-form>
			</div>
			<KTable :data="tableData" :loading="loading" :mobile="mobile" v-slot:default="scope" @scroll.native="onWrapperScroll" :style="{marginTop:formfilterHeight+'px'}">
				<KTableColumn label="ID" :column="scope">
					<template v-slot:template>
						<input type="checkbox" @change="onCheckboxChange(scope, $event)" :checked="scope.checked" />
					</template>
				</KTableColumn>
				<KTableColumn label="状态" prop="coun_IP" :column="scope">
					<template v-slot:template>
						<div>{{scope.coun_IP}}(<span style="color:#00cc00">{{(scope.coun_Type||'bootstrap').substring(0,4)}}</span>)<span style="float:right">{{scope.coun_Time}}</span></div>
						<div><span>{{scope.coun_URL}}</span></div>
						<div style="color:#ccc" @click="onShowMore($event)">
							{{scope.coun_OS}} {{scope.coun_Browser}}
						</div>
						<div class="log-detail" @click="onShowMore($event)">
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

import dom from '@/lib/core/dom';

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
			tableColumns:[1,2,3],
			formfilter:{},
			formfilterOpened:false,
			formfilterHeight:0
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
		...mapActions('admin_log',['nextPage','removeByIds','reload']),
		...mapMutations('admin_log',['updateScroll','update','checkall', 'setCurrentPage']),

		onToggleFilterDisplay(){
			this.formfilterOpened = !this.formfilterOpened;
			this.$nextTick(()=>{
				this.updateTableMargin();
			});
			
		},
		checkEnd(){
			if( this.list && this.list.pagination ){
	    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
	    			this.loading = false;
	    			return;
	    		}
	    	}
	    	this.loading = true;
		},
		updateTableMargin(){
			if( this.$refs.filter ){
				this.formfilterHeight = this.$refs.filter.offsetHeight;
			}
		},
		onCheckboxChange(scope, checked){
			if( typeof checked == 'object'){
				checked = checked.target.checked;
			}
			let data = {...scope, checked};
			this.update( data );
		},

		onShowMore(e){
			let target = e.target;
			let find = dom.closet( target, 'tr');
			let detail = dom.query(".log-detail", find);
			dom.toggleDisplay( detail );
		},

		checkData(){
			if( this.list && this.list.data.length <=0 ){
				this.setCurrentPage( 0 );
				this.nextPage( this.formfilter );
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
		onFormFilter(){
			this.reload( this.formfilter ).then(res=>{
				this.checkEnd();
			});
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
			this.nextPage( this.formfilter ).then(res=> this.checkEnd() );
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
		if( !this.tableData || !this.tableData.length ){
			this.nextPage( this.formfilter ).then(res=>{
				this.checkEnd();
			}).catch(e=>{
				this.$network(e);
				setTimeout(_=>{
					this.$router.push({path: '/account/login', query: {'ref': this.$route.fullPath}})
				},2000)
			});
		}else{
			//this.$el.querySelector(".mod-table").scrollTop = this.scrollTop;
			this.$animate();
		}
		this.$root.$onScroll = this.onScroll;
		this.$root.$onScrollBottom = this.onReachBottom;
		this.onScrollHandler = this.onScroll.bind(this);
		this.onReachBottomHandler = this.onReachBottom.bind(this);
		this.$root.$on('scroll',this.onScrollHandler )
		this.$root.$on('reachbottom',this.onReachBottomHandler )

		this.updateTableMargin();
		//this.$layoutTable();
	}
}
export {admin_log};
export default admin_log;
</script>
<style lang="less" scoped>
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
	.log-detail{
		display: none;
	}
	
</style>