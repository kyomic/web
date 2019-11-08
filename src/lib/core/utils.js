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

export default utils;