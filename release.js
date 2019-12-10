const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
let child_process = require('child_process');
let target = "D:\\centos_share\\myphp\\think\\public\\";

let staticDir = path.resolve( target,"static");
console.log("发布至:" , staticDir );

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

var syncFiles = function(){
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

//syncFiles();
//copy( path.resolve('./dist'), staticDir );
//