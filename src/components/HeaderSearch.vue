<template>
	<div v-if="shown" :class="showfull?'search-full':'search-normal'">
		<el-row>
			<el-col>
				<el-row type="flex" align="middle" justify="space-around">
					<el-input
              placeholder="请输入内容"
              v-model="keyword"
              size="small" @input.native="onSearch">
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
          <i v-if="showclose" class="el-icon-close" @click="onHideSearch"></i>
				</el-row>				
	        </el-col>
		</el-row>
	</div>
	<div v-else class="mod-search mod-search-min">
		<i class="el-icon-search" @click="onShowSearch"></i>
	</div>
</template>
<script>

let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import Devices from '@/lib/core/Devices';


export default {
  name: 'HeaderSearch',
  data() {
    return {
    	mobile:true,
    	keyword:""
    };
  },
  props:{
    onReachBottom:{
      type:Function,required:false,
    }
  },
  computed:{
    ...mapState('search', ['shown']),
    ...mapState('env', ["router"]),
    inSearchPage:function(){
      return (/search/ig).exec(Devices.getInstance().currentPage.url)
    },
    /** 
     * 是否显示全屏模式
     */
    showfull(){      
      if( this.mobile ){
        return true;
      }
      return false;
    },
    showclose:function(){
      if( this.router && this.router.current ){
        if( this.router.current.name == 'search'){
          return false;
        }
      }
      if( this.mobile ){
        return true;
      }
    }
  },
  methods:{
  	...mapMutations("search", ["showSearch"]),
    ...mapActions("search",["query"]),
  	onShowSearch(){
  		this.showSearch( true );
  	},
  	onHideSearch(){
  		this.showSearch( false );
  	},
    onSearch(){
      if( this.searchTimeoutId ){
        clearTimeout( this.searchTimeoutId );
      }
      this.searchTimeoutId = setTimeout(()=>{
        let router = this.router;
        if( this.router.name !='search'){          
          //不是搜索页
          this.$router.push({path: '/search', query: {keyword: this.keyword}})
        }
        this.query( {'keyword':this.keyword} );
        return;
        let routeUrl = this.$router.resolve(
          {path: '/search', query: {keyword: this.keyword}}
        );
        //window.open(routeUrl.href, '_self');
      },500)
    },
  	checkSize(){
  		let code = Devices.getInstance().grid24code;
  		if( !code || code.indexOf('xs')==-1){
  			this.showSearch( true );
  			this.mobile = false;
  		}else{
  			this.showSearch( false );
  			this.mobile = true;
  		}
      if( this.inSearchPage ){
        this.showSearch(true);
      }
  		console.log("closeabled", this.closeabled, this.shown, 'code=', code)
  	}
  },
  mounted(){
  	Devices.getInstance().on('resize', this.checkSize );
  	Devices.getInstance().on('load', this.checkSize );
  	this.checkSize();
    console.log("HeaderSearch is mounted")
  }
};
</script>
<style lang="less" scoped>
	.el-icon-close{
		font-size: 22px;
	}
	.mod-search{
		display: inline-block;
	}
	.search-full{
		width: 100%;
		position: absolute;
		background:white;
		left: 0;top: 0;
	}
  .search-full > .el-row > .el-col{
    padding:5*@rem;
  }
	.search-normal{
		width: 100%;
	}
</style>