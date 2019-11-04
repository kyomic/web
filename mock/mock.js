let Mock = require('mockjs');
let basicData = Mock.mock({
    'list|1-100': [{
        'id|+1': 1,
        'isBoolean': '@boolean(10, 0, true)',//百分之百的true
        'naturalNumber': '@natural(1, 1000)', //大于等于零的整数
        'integer': '@integer(0)', //随机整数
        'float': '@float(1, 100, 3, 6)', //随机浮点数, 
        'character': '@character("upper")', //一个随机字符
        'string': '@string("lower", 5, 20)', //一串随机字符串
        'range': '@range(1, 10, 2)', //一个整形数组，步长为2
    }]
});

// console.log(basicData);

let Date = Mock.mock({
    'dateList|10': [{
        'date': '@date',
        'date-yyyy-MM-dd': '@date(yyyy-MM-dd)',
        'date-yy-MM-dd': '@date(yy-MM-dd)',
        'date-y-MM-dd': '@date(y-MM-dd)',
        'date-y-M-d': '@date(y-M-d)',
        'line-through': '------------------------------------------------',
        'timessss': '@time', //随机的时间字符串,
        'time-format': '@time()', //指示生成的时间字符串的格式, default: 'HH: mm: ss',
        'time-format-1': '@time("A HH:mm:ss")',
        'time-format-2': '@time("a HH:mm:ss")',
        'time-format-3': '@time("HH:mm:ss")',
        'time-format-4': '@time("H:m:s")',
        'datetime': '@datetime("yyyy-MM-dd A HH:mm:ss")', //返回一个随机的日期和时间字符串
        'dateNow': '@now("second")' //获取当前完整时间
    }]
});
// console.log(Date);

let imageList = Mock.mock({
    'imageList|5': [{
        'id|+1': 1,
        'img': '@image',//生成一个随机的图片地址,
        'img-1': '@image("200x100", "#000", "#fff", "png", "Mock.js")', //生成一个200*100, 背景色#000，前景色#fff, 格式png, 文字mock.js的图片
    }]
})
// console.log(imageList);

let paragraph = Mock.mock({
    'paragraphList|5': [{
        'id|+1': 1,
        'paragraph1': '@cparagraph(2)', //生成一段2句话的中文文本,
        'paragraph2': '@paragraph(3)', //生成一个3句话的英文文本
        'title': '@title', //随机生成一个英文标题
        'ctitle': '@ctitle', //随机生成一个中文标题
    }]
})
// console.log(paragraph);

let name = Mock.mock({
    'nameList|5': [{
        'id|+1': 1,
        'name': '@name', //英文名,
        'cname': '@cname', //中文名
    }]
})
// console.log(name);

let webList = Mock.mock({
    'webList|5': [{
        'id|+1': 0,
        'url': '@url("http", "baidu.com")', //url: http://www.baidu.com
        'protocol': '@protocol', //随机生成一个url协议
        'domain': '@domain', //随机生成一个域名,
        'email': '@email', //随机生成一个邮箱地址,
        'ip': '@ip' //随机生成一个ip地址
    }]
})

let article = {
    list : Mock.mock({
        'list|5': [{
            'id|+1': 1,
            'desc': '@cparagraph(2)', //生成一段2句话的中文文本,
            'paragraph2': '@paragraph(3)', //生成一个3句话的英文文本
            'title': '@cparagraph(1)', //随机生成一个英文标题
            'ctitle': '@ctitle', //随机生成一个中文标题
        }],
        'pagination':{
            current:1,
            total:100,
            pagesize:10,
            count:5
        }
    }),
    detail: Mock.mock({
        'id': 1,
        'desc': '@cparagraph(2)',
        'title': '@cparagraph(1)'
    })
} 

let search = {
    list : Mock.mock({
        'list|1-5': [{
            'id|+1': 1,
            'desc': '@cparagraph(2)', //生成一段2句话的中文文本,
            'paragraph2': '@paragraph(3)', //生成一个3句话的英文文本
            'title': '@cparagraph(1)', //随机生成一个英文标题
            'ctitle': '@ctitle', //随机生成一个中文标题
        }],
        'pagination':{
            current:1,
            total:100,
            pagesize:10,
            count:5
        }
    })
}
// console.log(webList);

let address = Mock.mock({
    'data|5': [{
        'id|+1': 1,
        'region': '@region', //生成一个大区
        'province': '@province', //生成一个省份
        'city': '@city', //生成一个市
        'country': '@country', //一个县
        'zip': '@zip', //邮政编码
    }]
})

const proxy = {
  'GET /api/user': {id: 1, username: 'kenny', sex: 6 },
  'GET /api/user/login':{
    status:200,
    data:{
        token:'abc',user_id:111
    }
  },
  'GET /api/user/list': [
    {id: 1, username: 'kenny', sex: 6 },
    {id: 2, username: 'kenny', sex: 6 }
  ],
  'GET /api/article/list': ( req, res )=>{
    return res.send({status:200,data:article.list })
  },
  'GET /api/article/detail': ( req, res )=>{
    return res.send({status:200,data:article.detail })
  },
  'GET /api/search':( req, res)=>{
    return res.send({status:200, data:search.list})
  },
  'POST /api/login/account': (req, res) => {
    const { password, username } = req.body;
    if (password === '888888' && username === 'admin') {
      return res.send({
        status: 'ok',
        code: 0,
        token: "sdfsdfsdfdsf",
        data: {id: 1, username: 'kenny', sex: 6 }
      });
    } else {
      return res.send({status: 'error', code: 403 });
    }
  },
  'DELETE /api/user/:id': (req, res) => {
    console.log('---->', req.body)
    console.log('---->', req.params.id)
    res.send({ status: 'ok', message: '删除成功！' });
  }
}



module.exports = proxy;