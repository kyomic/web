'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
// build/webpack.dev.conf.js 大概在15行
let externalConfig = JSON.parse(JSON.stringify(utils.externalConfig));  // 读取配置
let externalModules = utils.getExternalModules(externalConfig); // 获取到合适路径和忽略模块
externalModules = {};
externalConfig = [];
const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const webpackMock = require('webpack-api-mocker');

const devWebpackConfig = merge(baseWebpackConfig, {
  externals: externalModules,
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    before(app){
      webpackMock( app , path.resolve(__dirname, '../mock/mock.js'));
    },
    clientLogLevel: 'warning',
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    }
  },
  plugins: [    
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),   
    
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      chunks: ['manifest','vendor','app'],
      inject: true,
      cdnConfig: externalConfig, // cdn配置
      onlyCss: false, //加载css
    }),
    new HtmlWebpackPlugin({
      filename: 'admin.html',
      template: 'admin.html',
      chunks: ['manifest','vendor','admin'],
      inject: true,
      cdnConfig: externalConfig, // cdn配置
      onlyCss: false, //加载css
    }),
    new HtmlWebpackPlugin({
      filename: 'labs.html',
      template: 'labs.html',
      chunks: ['manifest','vendor','labs'],
      inject: true,
      cdnConfig: externalConfig, // cdn配置
      onlyCss: false, //加载css
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
