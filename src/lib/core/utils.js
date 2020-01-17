import tpl from './tpl'
let utils = {}
/**
 * 对字符串进行哈希计算
 * @name utils.stringhash
 * @function
 * @grammar F.string.hash(str[, len])
 * @param {String} str 目标字符串
 * @param {Integer} len 产生哈希字符串长度 默认: 32
 * @returns {String} 哈希后的字符串
 */
utils.stringhash = function( str, len ){
    /* 对两个字符串进行异或运算
     */
    var stringxor = function( s1, s2 ) {
        var s = '', hash = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', max = Math.max( s1.length, s2.length );
        for ( var i = 0; i < max; i++ ) {
            // 将两个字符串对应字符的 Unicode 编码进行异或运算
            // 把运算结果取模, 去字符表中取对应字符
            var k = s1.charCodeAt( i ) ^ s2.charCodeAt( i );
            s += hash.charAt( k % 52 );
        }
        return s;
    };
    len = len || 32;
    var start = 0, i = 0, result = '', filllen = len - str.length % len;
    //使用字符0,将字符串长度补齐为哈希长度的倍数
    for ( i = 0; i < filllen; i++ ) {
        str += "0";
    }
    //将字符串分成 (str/len) 份,将上一次哈希后的字符串与下一组字符串进行哈希
    while ( start < str.length ) {
        result = stringxor( result, str.substr( start, len ) );
        start += len;
    }
    return result;

}

utils.decodeHTML = function( str ){
    var s = "";
    if(str.length == 0) return "";
    s = str.replace(/&amp;/g,"&");
    s = s.replace(/&lt;/g,"<");
    s = s.replace(/&gt;/g,">");
    s = s.replace(/&nbsp;/g," ");
    s = s.replace(/&#39;/g,"\'");
    s = s.replace(/&quot;/g,"\"");
    return s;
}
utils.encodeHTML = function( str ){
    var s = "";
    if(str.length == 0) return "";
    s = str.replace(/&/g,"&amp;");
    s = s.replace(/</g,"&lt;");
    s = s.replace(/>/g,"&gt;");
    s = s.replace(/ /g,"&nbsp;");
    s = s.replace(/\'/g,"&#39;");
    s = s.replace(/\"/g,"&quot;");
    return s; 
}


// 对Date的扩展，将 Date 转化为指定格式的String   
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
// 例子：   
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18   
Date.prototype.Format = function(fmt)   
{ //author: meizz   
  var o = {   
    "M+" : this.getMonth()+1,                 //月份   
    "d+" : this.getDate(),                    //日   
    "h+" : this.getHours(),                   //小时   
    "m+" : this.getMinutes(),                 //分   
    "s+" : this.getSeconds(),                 //秒   
    "q+" : Math.floor((this.getMonth()+3)/3), //季度   
    "S"  : this.getMilliseconds()             //毫秒   
  };   
  if(/(y+)/.test(fmt))   
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
  for(var k in o)   
    if(new RegExp("("+ k +")").test(fmt))   
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
  return fmt;   
}  

utils.compile = tpl.compile;
export default utils;