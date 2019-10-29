const path = require('path');
const koa = require('koa');
const koastatic = require('koa-static');
const app = new koa();

app.use(koastatic( path.join(__dirname, '../dist') ));  
app.listen(3001,function(){
    console.log('启动成功 localhost:3001');
});