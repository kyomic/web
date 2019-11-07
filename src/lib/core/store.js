import Devices from "./Devices";
import DevicesType from "@/lib/core/consts/DevicesType"
/**
 * Cookie
 * @class
 */
let cookie = {
    /**
     * 获取Cookie值
     * @name F.tool.cookie.get
     * @method
     * @grammar F.tool.cookie.get(name)
     * @param {String} name Cookie名
     * @shortcut F.cookie.get
     * @see F.tool.cookie.set,F.tool.cookie.del,F.cookie.set,F.cookie.del
     * @remark
     *
     返回对应值前, 会对字符串进行解码

     * @return {String} Cookie值
     */
    get : function( name ) {
        // eg: 'name1=value1; name2=value2; name3=value3; name4=value4'
        var c = document.cookie;
        if ( !c.length ) {
            return '';
        }
        var tp = c.split( '; ' );
        for ( var i = tp.length - 1; i >= 0; i-- ) {
            var tm = tp[ i ].split( '=' );
            if ( tm.length > 1 && tm[ 0 ] == name && tm[ 1 ] ) {
                return unescape( ( tm[ 1 ]+'' ).replace(/^\s+|\s$/g,'') );
            }
        }
        return '';
    },
    /**
     * 设置Cookie值
     * @name F.tool.cookie.set
     * @function
     * @grammar F.tool.cookie.set(name, value[, day, domain])
     * @param {String} name Cookie名
     * @param {String} value Cookie值
     * @param {String} day 有效天数, 默认 365天，-1则设置为会话cookie
     * @param {String} domain Cookie保存的域, 默认为 .funshion.com
     * @param {String} usehost 使用host设置cokie
     * @shortcut F.cookie.set
     * @see F.tool.cookie.get,F.tool.cookie.del,F.cookie.get,F.cookie.del
     * @remark
     *
     会对Cookie值进行字符串编码后存储

     */
    set : function( name, value, day, domain, usehost ) {
        day = day || 365, domain = domain || '', usehost = usehost || 0;
        var expires = new Date();
        expires.setTime( (new Date()).getTime() + 3600 * 24 * 1000 * day );
        document.cookie = name + '=' + escape( value ) + '; path=/; ' + (usehost ? 'host' : 'domain') + '=' + domain + (day == -1 ? '' : ';expires=' + expires.toGMTString());
    },
    /**
     * 获取Cookie值
     * @name F.tool.cookie.del
     * @function
     * @grammar F.tool.cookie.del(name)
     * @param {String} name Cookie名
     * @shortcut F.cookie.del
     * @see F.tool.cookie.get,F.tool.cookie.set,F.cookie.get,F.cookie.set
     */
    remove : function( name ) {
        this.set( name, '', -365, null, 0 );
        this.set( name, '', -365, document.location.host, 1 );
    }
};
let localStorage = {

}


let defaultStore = null;
let getDefaultStore = ()=>{
	if( !defaultStore ){
		let type = Devices.getInstance().runtimeType;
        if( type == DevicesType.BROWSER ){

        }
        defaultStore = cookie;
	}
	return defaultStore;
}
let store = {
	set:function( name, value ){
        getDefaultStore().set( name, value );
	},
	get:function( name ){
        return getDefaultStore().get(name);
	},
	remove:function(name){
        return getDefaultStore().remove(name);
	},
	cookie
}

export default store;
export {store};