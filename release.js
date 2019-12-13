const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const iconv = require('iconv-lite');
let child_process = require('child_process');
let target = "D:\\centos_share\\myphp\\think\\public\\";
let devFile = "D:\\centos_share\\myphp\\think\\application\\config\\config.php";

let staticDir = path.resolve( target,"static");
let args = process.argv.splice(2);
let dev = args && args[0] == 'dev' ? true: false;
console.log("环境:dev="+ dev + ", 发布至:" , staticDir );

function DeleteDirectory(dir) {
	if (fs.existsSync(dir) == true) {
		var files = fs.readdirSync(dir);
		files.forEach(function(item){
			var item_path = path.join(dir, item);
			if (fs.statSync(item_path).isDirectory()) {
				DeleteDirectory(item_path);
			}
			else {
				fs.unlinkSync(item_path);
			}
		});
		fs.rmdirSync(dir);
	}
}

var copy=function(src,dst, cb ){
    let paths = fs.readdirSync(src); //同步读取当前目录
    console.log("copy", paths)
    paths.forEach(function(path){
        var _src=src+'/'+path;
        var _dst=dst+'/'+path;
        fs.stat(_src,function(err,stats){  //stats  该对象 包含文件属性
            if(err)throw err;
            if(stats.isFile()){ //如果是个文件则拷贝 
                let  readable=fs.createReadStream(_src);//创建读取流
                let  writable=fs.createWriteStream(_dst);//创建写入流
                readable.pipe(writable);
                cb && cb();
            }else if(stats.isDirectory()){ //是目录则 递归 
                checkDirectory(_src,_dst,copy);
            }
        });
    });
}
var checkDirectory=function(src,dst,callback){
    fs.access(dst, fs.constants.F_OK, (err) => {
        if(err){
            fs.mkdirSync(dst);
            callback(src,dst);
        }else{
            callback(src,dst);
        }
      });
};
let buildPath = path.resolve('build/build.js')
let versionPath = path.resolve('src/lib/config.js');

var getDateTime = function(){
    var nowtime = new Date();
    var buildtime = [
        nowtime.getFullYear(),
        (nowtime.getMonth()+1).toString().padStart(2,"0"),
        nowtime.getDate().toString().padStart(2,"0"),
        nowtime.getHours().toString().padStart(2,"0"),
        nowtime.getMinutes().toString().padStart(2,"0")
    ].join("");
    return buildtime;
}
var updateVersion = function(){
    let code = [
        '//inject start\n',
        '$dev='+dev+';\n',
        '//inject end\n'
    ].join("");
    
    let content = fs.readFileSync(devFile);
    content = iconv.decode(content, 'utf8');
    content = content.replace(/\/\/inject start.*[\s\S]*\/\/inject end\n?/ig, code );
    fs.writeFileSync(devFile, content);
    console.log("更新Javascript版本");
    content = fs.readFileSync(versionPath);
    content = iconv.decode(content, 'utf8');

    content = content.replace(/config\.buildtime\s*\=\s*"[^\"]*";/ig,"config.buildtime = \""+ getDateTime() +"\";" );
    fs.writeFileSync(versionPath, content);
}
var syncFiles = function(){
    updateVersion();
    DeleteDirectory( staticDir );
	copy( path.resolve('./dist'), target ,function(){
        setTimeout(_=>{
            let templateFile = path.resolve(target, "template.html");
            try{
                fs.unlinkSync(templateFile)
            }catch(e){}            
            fs.copyFileSync(path.resolve(target, "index.html"),templateFile , fs.constants.COPYFILE_FICLONE);
        },2000);
        
	});
	
}

let wp = require(buildPath)
wp.callback(function(){
	console.log("发布完毕,正在同步文件")
	syncFiles();
})


//updateVersion();


//syncFiles();
//copy( path.resolve('./dist'), staticDir );
//