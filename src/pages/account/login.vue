<template>
	<div class="mod-login">
		<el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm"  label-position="top" label-width="100px" class="ruleForm">
		  <el-form-item label="邮箱" prop="pass">
		    <el-input type="password" v-model="ruleForm.pass" autocomplete="off"></el-input>
		  </el-form-item>
		  <el-form-item label="确认密码" prop="checkPass">
		    <el-input type="password" v-model="ruleForm.checkPass" autocomplete="off"></el-input>
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
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import request from "@/lib/request"
import urls from "@/lib/core/urls"

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
          pass: '',
          checkPass: '',
          age: ''
        },
        rules: {
          pass: [
            { validator: validatePass, trigger: 'blur' }
          ],
          checkPass: [
            { validator: validatePass2, trigger: 'blur' }
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
      submitForm(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {
            this.login( this.ruleForm ).then(res=>{
            	if( this.isLogined ){
            		let url = this.$route.fullPath;
            		let ref = urls.getQueryValue('ref', url);
            		if( ref ){
            			try{
            				ref = decodeURIComponent(ref)
            			}catch(e){}
            			console.log('ref', ref)
            			this.$router.back();
            		}
            		console.log("url", qs.parse( url ), url)
            	}else{
            		console.log("loginerrr")
            	}
            });
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      resetForm(formName) {
        this.$refs[formName].resetFields();
      }
    }
 }
</script>
<style lang="less">
.mod-login{
	text-align: left;
	padding: 20px;
	.el-form-item{
		padding:0;
		color: red;
		label{
			padding: 0;
		}
		.el-form-item__label{
			padding: 0;
		}
	}
}
</style>