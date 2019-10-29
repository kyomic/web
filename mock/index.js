(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mock = factory());
}(this, (function () { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var Mock = require('mockjs');

  var basicData = Mock.mock({
    'list|1-100': [{
      'id|+1': 1,
      'isBoolean': '@boolean(10, 0, true)',
      //百分之百的true
      'naturalNumber': '@natural(1, 1000)',
      //大于等于零的整数
      'integer': '@integer(0)',
      //随机整数
      'float': '@float(1, 100, 3, 6)',
      //随机浮点数, 
      'character': '@character("upper")',
      //一个随机字符
      'string': '@string("lower", 5, 20)',
      //一串随机字符串
      'range': '@range(1, 10, 2)' //一个整形数组，步长为2

    }]
  });
  var Listjs = {
    // 支持值为 Object 和 Array
    'GET /api/list': function GETApiList(req, res) {
      res.send({
        status: 'ok',
        data: basicData
      });
    }
  };

  // 代码中会兼容本地 service mock 以及部署站点的静态数据
  var Userjs = {
    // 支持值为 Object 和 Array
    'GET /api/currentUser': {
      name: 'Serati Ma',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
      userid: '00000001',
      email: 'antdesign@alipay.com',
      signature: '海纳百川，有容乃大',
      title: '交互专家',
      country: 'China',
      geographic: {
        province: {
          label: '浙江省',
          key: '330000'
        },
        city: {
          label: '杭州市',
          key: '330100'
        }
      },
      address: '西湖区工专路 77 号',
      phone: '0752-268888888'
    },
    'POST /api/register': function POSTApiRegister(req, res) {
      res.send({
        status: 'ok',
        currentAuthority: 'user'
      });
    },
    'GET /api/500': function GETApi500(req, res) {
      res.status(500).send({
        timestamp: 1513932555104,
        status: 500,
        error: 'error',
        message: 'error',
        path: '/base/category/list'
      });
    }
  };

  var data = _objectSpread2({}, Listjs, {}, Userjs);

  return data;

})));
