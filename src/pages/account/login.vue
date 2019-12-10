<template>
	<div class="mod-login">
		<el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm"  label-position="top" label-width="100px" class="ruleForm">
		  <el-form-item label="用户名/邮箱" prop="user">
		    <el-input v-model="ruleForm.user" autocomplete="off"></el-input>
		  </el-form-item>
		  <el-form-item label="密码" prop="pass">
		    <el-input type="password" v-model="ruleForm.pass" autocomplete="off"></el-input>
		  </el-form-item>
		  <el-form-item>
		    <el-button type="primary" @click="submitForm('ruleForm')">提交</el-button>
		    <el-button @click="resetForm('ruleForm')">重置</el-button>
		  </el-form-item>
		</el-form>
	</div>
</template>
<script>
import qs from 'qs';
let { mapState, mapGetters, mapActions, mapMutations } = require('Vuex')
import request from "@/lib/request"
import urls from "@/lib/core/urls"
import store from "@/lib/core/store"

import ScrollView from "@/components/ScrollView";

export default {
    data() {
      var checkAge = (rule, value, callback) => {
        if (!value) {
          return callback(new Error('年龄不能为空'));
        }
        setTimeout(() => {
          if (!Number.isInteger(value)) {
            callback(new Error('请输入数字值'));
          } else {
            if (value < 18) {
              callback(new Error('必须年满18岁'));
            } else {
              callback();
            }
          }
        }, 1000);
      };
      var validatePass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else {
          if (this.ruleForm.checkPass !== '') {
            this.$refs.ruleForm.validateField('checkPass');
          }
          callback();
        }
      };
      var validatePass2 = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请再次输入密码'));
        } else if (value !== this.ruleForm.pass) {
          callback(new Error('两次输入密码不一致!'));
        } else {
          callback();
        }
      };
      return {
        ruleForm: {
          user: '',
          pass: '',
          age: ''
        },
        rules: {
          user: [
            { validator: validatePass, trigger: 'blur' }
          ],
          pass: [
            { validator: validatePass, trigger: 'blur' }
          ],
          age: [
            { validator: checkAge, trigger: 'blur' }
          ]
        }
      };
    },
    computed:{
    	...mapGetters("user",["isLogined"])
    },
    methods: {
    	...mapActions("user",["login"]),
      checkIsLogined(){
        if( this.isLogined ){
          let url = this.$route.fullPath;
          let ref = urls.getQueryValue('ref', url);
          if( ref ){
            try{
              ref = decodeURIComponent(ref)
            }catch(e){}
          }
          console.log("url", qs.parse( url ), url)
          if( ref && /admin/ig.exec( ref )){
            location.href = "/admin.html";
          }else{
            this.$router.back();
          }
          
        }else{
          console.log("loginerrr")
        }
      },
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.login( this.ruleForm ).then(res=>{
            	this.checkIsLogined();
            }).catch(e=>{
              this.$network( e );
            })
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      resetForm(formName) {
        this.$refs[formName].resetFields();
      }
    },
    mounted(){
      this.checkIsLogined();
      document.addEventListener('keyup', e=>{
        if( e.keyCode == 13 ){
          this.submitForm('ruleForm')
        }
      })
    }
 }
</script>
<style lang="less" scoped>
.mod-login{
	text-align: left;
	padding: 20px;
}
</style>