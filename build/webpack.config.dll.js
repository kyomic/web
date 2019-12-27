const path = require('path');
const webpack = require('webpack');
const DllPlugin = require('webpack/lib/DllPlugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const FirendlyErrorePlugin = require('friendly-errors-webpack-plugin');
const config = require('../config')

module.exports = {
    //mode: 'production',
    entry: {
        vendor: ['vue/dist/vue.esm.js','Vuex/dist/vuex.esm.js','vuex', 'axios', 'vue-router', 'element-ui']
    },
    resolve: {
    },
    output: {
        // 指定生成文件所在目录
        // 由于每次打包生产环境时会清空 dist 文件夹，因此这里我将它们存放在了 public 文件夹下
        path: path.resolve(__dirname, '../dist/vendor/'),
        // 指定文件名
        filename: '[name].dll.js',
        // 存放动态链接库的全局变量名称，例如对应 lodash 来说就是 lodash_dll_lib
        // 这个名称需要与 DllPlugin 插件中的 name 属性值对应起来
        // 之所以在前面 _dll_lib 是为了防止全局变量冲突
        library: '[name]_dll'  // 保持与 webpack.DllPlugin 中名称一致
    },
    devtool: 'inline-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new DllPlugin({
            name:'[name]_dll', // 保持与 output.library 中名称一致
            path: path.resolve(__dirname, '../dist/vendor', '[name].manifest.json'), //描述生成的manifest文件
            context:__dirname
        }),
        new webpack
            .optimize
            .UglifyJsPlugin({
                compress: {
                    warnings: false, //删除无用代码时不输出警告
                    drop_console: true, //删除所有console语句，可以兼容IE
                    collapse_vars: true, //内嵌已定义但只使用一次的变量
                    reduce_vars: true, //提取使用多次但没定义的静态值到变量
                },
                output: {
                    beautify: false, //最紧凑的输出，不保留空格和制表符
                    comments: false, //删除所有注释
                }
            })
    ]
}