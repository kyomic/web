'use strict'
const path = require('path')
const config = require('../config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const fs = require('fs');
const packageConfig = require('../package.json')

exports.assetsPath = function (_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory

  return path.posix.join(assetsSubDirectory, _path)
}

exports.cssLoaders = function (options) {
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader'
      })
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    //less: generateLoaders('less'),
    less:generateLoaders('less').concat(
      {
        loader: 'sass-resources-loader',
        options: {
          resources: path.resolve(__dirname, '../src/assets/variables.less')//这里按照你的文件路径填写
        }
      }
    ),
    sass: generateLoaders('sass', { indentedSyntax: true }),    
    //scss: generateLoaders('sass'),
    scss:generateLoaders('sass').concat(
      {
        loader: 'sass-resources-loader',
        options: {
          resources: path.resolve(__dirname, '../src/assets/variables.scss')//这里按照你的文件路径填写
        }
      }
    ),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  const output = []
  const loaders = exports.cssLoaders(options)

  for (const extension in loaders) {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  return output
}

exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}

exports.cdnBaseHttp = 'https://cdn.bootcss.com';
//  build/utils.js external配置
exports.externalConfig = [
  { name: 'vue', scope: 'Vue', js: 'vue.min.js' },
  { name: 'Vuex', scope: 'Vuex', js:'vuex.min.js' },
  { name: 'vue-router', scope: 'VueRouter', js: 'vue-router.min.js' },
  { name: 'axios', scope: 'axios', js: 'axios.min.js' },
  { name: 'element-ui', scope: 'ELEMENT', js: 'index.js', css: 'theme-chalk/index.css' },
  { name: 'quill', scope: 'Quill', js: 'quill.min.js', css: 'quill.snow.min.css' },
  { name :'ua-parser-js', webname:'UAParser.js', scope:'UAParser',js:'ua-parser.min.js'}
];

//是否通过命令行打包 sh release.sh
exports.getIsPackModel = ()=>{
  let cmd = process.argv[1];
  if( cmd && cmd.indexOf('release')!=-1){
    return true;
  }
  return false;
}

exports.getDevDependencies = ()=>{
  let devDependencies = packageConfig.devDependencies || {};
  let dependencies = packageConfig.dependencies || {};
  for(var i in devDependencies ){
    dependencies[i] = devDependencies[i];
  }
  return dependencies;
}
// build/utils.js 获取模块版本号
exports.getModulesVersion = () => {
  this.getDevDependencies();
  let mvs = {};
  let regexp = /^npm_package_.{0,3}dependencies_/gi;
  if( this.getIsPackModel()){
    let dep = this.getDevDependencies();
    for (let m in dep) { // 从node内置参数中读取，也可直接import 项目文件进来
      mvs[m] =  dep[m].replace(/(~|\^)/ig, '');
    }
  }else{
    for (let m in process.env) { // 从node内置参数中读取，也可直接import 项目文件进来
      if (regexp.test(m)) { // 匹配模块
         // 获取到模块版本号
        mvs[m.replace(regexp, '').replace(/_/g, '-')] = process.env[m].replace(/(~|\^)/g, '');
      }
    }
  }
  return mvs;
};

// build/utils.js
//导出不需要被打包的cdn模块配置
exports.getExternalModules = config => {
  let externals = {}; // 结果
  let dependencieModules = this.getModulesVersion(); // 获取全部的模块和版本号
  config = config || this.externalConfig; // 默认使用utils下的配置
  config.forEach(item => { // 遍历配置
    let name = item.name.toLowerCase();
    if ( name in dependencieModules) {
      let version = dependencieModules[name];
      // 拼接css 和 js 完整链接
      item.css = item.css && [this.cdnBaseHttp, name, version, item.css].join('/');
      item.js = item.js && [this.cdnBaseHttp, item.webname || name, version, item.js].join('/');
      externals[item.name] = item.scope; // 为打包时准备
    } else {
      if( !this.getIsPackModel() ){
        throw new Error('相关依赖未安装，请先执行npm install ' + name);
      }
    }
  });
  return externals;
};