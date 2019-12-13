<template>
	<div class="page-wrap-content admin_article>">
		<div class="wrapper" ref="wrapper">
			<div :class="scrolling?'pagination-tip pagination-tip-show':'pagination-tip'">
				<div class="pagination-tip-wrap">
					{{Math.min(list.pagination.page*list.pagination.pagesize,list.pagination.total)}}/{{list.pagination.total}}
				</div>
			</div>
			<div :class="formfilterOpened?'table-filter':'table-filter table-filter-min'" ref="filter">
				<i class="filter-extends el-icon-arrow-up" @click="onToggleFilterDisplay"></i>
				<el-form :inline="true" :model="formInline" class="demo-form-inline" size="mini">
				  <el-form-item label="键　">
				    <el-input v-model="formfilter.key" prefix-icon="el-icon-search" size="mini" placeholder="关键词"></el-input>
				  </el-form-item>
				  <el-form-item v-if="!formfilterOpened">
				    <el-button type="primary" @click="onFormFilter" size="mini" >查询</el-button>
				  </el-form-item>
				  <el-form-item label="" class="formfilter-field">
				    <el-select v-model="formfilter.field" size="mini" placeholder="名称">
				    	<el-option label="ID" value="figure_id"></el-option>
				      <el-option label="名称" value="name"></el-option>
				      <el-option label="系列" value="figure_series"></el-option>
				      <el-option label="原型" value="figure_sculptor"></el-option>
				      <el-option label="原画" value="figure_painter"></el-option>
				    </el-select>
				  </el-form-item>
				  <el-form-item label="站点">
				    <el-select v-model="formfilter.site" placeholder="来源站">
				    	<el-option label="所有" value=""></el-option>
					  <el-option v-for="(value,index) in siteinfo.site" :label="value.name" :value="value.id" v-bind:key="value.id"></el-option>
					</el-select>
				  </el-form-item>
				  <el-form-item label="年份" class="range-year">
				    <el-select v-model="formfilter.year_start" size="mini" placeholder="开始">
				      <el-option label="所有" value=""></el-option>
				      <el-option v-for="(value,key,index) in filterparams.year" :label="value+'年'" :key="value" :value="value"></el-option>
				    </el-select>
				    到
				    <el-select v-model="formfilter.year_end" size="mini" placeholder="结束">
				       <el-option label="所有" value=""></el-option>
				      <el-option v-for="(value,key,index) in filterparams.year" :label="value+'年'" :key="value" :value="value"></el-option>
				    </el-select>
				  </el-form-item>
				  <el-form-item>
				    <el-button type="primary" @click="onFormFilter" size="mini" >查询</el-button>
				  </el-form-item>
				</el-form>
			</div>

			<KTable :mobile="mobile" :data="tableData" :pagination="list.pagination" :loading="loading" v-slot:default="scope" @scroll.native="onWrapperScroll" @current-change="onPageChange" ref="mod-table" :style="{marginTop:formfilterHeight+'px'}">
				<KTableColumn label="ID" prop="figure_id" :column="scope" @click.native="onClick(scope)"></KTableColumn>
				<KTableColumn label="缩略图" :column="scope">
					<template v-slot:template>
						<img :src=" host.www + '/'+scope.figure_thumbs" v-if="scope.figure_thumbs" />
						<div v-else>empty</div>
					</template>
				</KTableColumn>
				<KTableColumn label="名称" prop="figure_name" :column="scope" @click.native="onClick(scope)"></KTableColumn>
				<KTableColumn label="状态"  :column="scope">
					<template v-slot:template>
						<div>
							{{scope.figure_release_date}}
							{{ scope.figure_price? scope.figure_price.replace('日圓 +消費稅','円'):''}}
						</div>
					</template>
				</KTableColumn>
				<KTableColumn label="操作" prop="action" :column="scope">
					<template v-slot:template>
			        	<el-button size="mini" @click.native="onEditHandler(scope)">修改</el-button>
			        </template>
				</KTableColumn>
				
			</KTable>
		</div>
		
		<div class="form-bottom-option">
			<div class="wrap">
			</div>
		</div>

	</div>
</template>

<script>
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import KTable from '@/components/KTable';
import KTableColumn from '@/components/KTableColumn';
import { figure } from '@/services/api';
import config from '@/lib/config'

let admin_figure = {
	name: 'admin_figure',
	components:{KTable,KTableColumn},
	data(){
		return {
			loading:true,
			tableColumns:[1,2,3],

			filterparams:{
				year:(function(){
					let fullyear = new Date().getFullYear() + 5;
					let res = [];

					while(fullyear>=2006){
						res.push( fullyear );
						fullyear-=1;
					}
					return res
				})()
			},
			//搜索项
			formfilter:{
				year:2018,
				site:""
			},
			formfilterOpened:false,
			formfilterHeight:0
		}
	},
	computed:{
	  	//环境状态
	  	...mapState('admin_figure',['list','scrollTop','currentPage']),
	    ...mapState('env', ['grid24code','router','host','scrolling']),
	    ...mapGetters('env', ['mobile']),
	    //用户状态
	    ...mapGetters('user',['isLogined', 'userinfo']),
	    //网站数据
	    ...mapGetters('figuresite',["siteinfo"]),

	    hasLoading(){
	    	if( !this.mobile ){
	    		//pc web
	    		if( this.list && this.list.pagination ){
	    			if( this.list.pagination.page == this.currentPage ){
	    				return false;
	    			}
	    		}
	    		return true;
	    	}
	    	if( this.list && this.list.pagination ){
	    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
	    			return false;
	    		}
	    	}
	    	return true;
	    },
	    tableData(){
	    	return this.list.data || [];
	    }
	},
	methods:{
		...mapActions('admin_figure',['nextPage','setPage', 'stopall', 'start', 'stop','reload']),
		...mapMutations('admin_figure',['updateScroll']),

		onAddHandler(row){
			this.$router.push({
				path:"/admin/figure_edit"
			})
		},
		onEditHandler:function( row ){
			this.$router.push({
				path:"/admin/figure_edit", query:{'id': row.id }
			})
		},
		onExecHandler:function( row ){
			if( row.status == 2 ){
				this.stop({id:row.id});
			}else{
				this.start({id:row.id});
			}
			
		},
		onClick:function( row ){
			location.href = config.host.www + '/figure/detail?id=' + row.id;
			return;
			this.$router.push({path: '/figure/detail', query: {'id': row.id}})
		},
		onScroll(e){},
		onReachBottom(e){
			this.loading = true;
			this.nextPage();
		},
		onPageChange(page){
			this.loading = true;
			this.setPage({page})
		},
		onSlotProps:function(){
			return arguments[0]
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

	    //搜索项
	    onToggleFilterDisplay(){
			this.formfilterOpened = !this.formfilterOpened;
			this.$nextTick(()=>{
				this.updateTableMargin();
			});			
		},
		
		updateTableMargin(){
			if( this.$refs.filter ){
				this.formfilterHeight = this.$refs.filter.offsetHeight;
			}
		},		
		onFormFilter(){
			this.reload( this.formfilter ).then(res=>{
				this.checkEnd();
			});
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
			this.nextPage().then(res=>{
				if( this.list && this.list.pagination ){
		    		if( this.list.pagination.maxpage <= this.list.pagination.page ){
		    			this.loading = false;
		    		}
		    	}
			}).catch(e=>{
				this.$network(e);
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


		this.$layoutTable();
		this.updateTableMargin();
	}
}
export {admin_figure};
export default admin_figure;
</script>
<style lang="less" scoped>
	.action{
		width: 100*@rem;
	}
	.mod-table{
		thead td:first-child{
			width:20*@rem;
		};
		thead td:last-child{
			width:45*@rem;
		};
		
	}
	table td:nth-child(2){
		padding:5*@rem 0;
		text-align: center;
	};
	table td{
		max-height: 40*@rem;
		overflow: hidden;

	}
	.com-loading{
		text-align: center;
	}
	.empty{
	    padding:30*@rem;
	    text-align: center;
	    color: #666;
	  }
	.range-year{
		.el-select{
			width: 70*@rem;
		}
	}
	.formfilter-field{
		width: 70*@rem;
	}
</style>