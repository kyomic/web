//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
// Ecmascript6 
// modify by kyomic@163.com
// 感谢Egret
// http://developer.egret.com/cn/github/egret-docs/Engine2D/update/update5231/index.html


import Endian from "./const/Endian";

class ByteArray{
	/**
	 * Constructor 构造器
	 * @param {Array} buffer 可为uint8array或arraybuffer 
	 */
	constructor( buffer, bufferExtSize = 0 ){
		if (bufferExtSize === null ) { bufferExtSize = 0; }
        /**
         * @private
         */
        this.bufferExtSize = 0; //Buffer expansion size
        /**
         * @private
         */
        this.EOF_byte = -1;
        /**
         * @private
         */
        this.EOF_code_point = -1;
        if (bufferExtSize < 0) {
            bufferExtSize = 0;
        }
        this.bufferExtSize = bufferExtSize;
        var bytes, wpos = 0;
        if (buffer) {
            var uint8 = void 0;
            if (buffer instanceof Uint8Array) {
                uint8 = buffer;
                wpos = buffer.length;
            }
            else {
                wpos = buffer.byteLength;
                uint8 = new Uint8Array(buffer);
            }
            if (bufferExtSize == 0) {
                bytes = new Uint8Array(wpos);
            }
            else {
                var multi = (wpos / bufferExtSize | 0) + 1;
                bytes = new Uint8Array(multi * bufferExtSize);
            }
            bytes.set(uint8);
        }
        else {
            bytes = new Uint8Array(bufferExtSize);
        }
        this.write_position = wpos;
        this._position = 0;
        this._bytes = bytes;
        this.data = new DataView(bytes.buffer);
        this.endian = Endian.BIG_ENDIAN;
	}

	/**
	 * 更改或读取数据的字节顺序；Endian.BIG_ENDIAN 或 Endian.LITTLE_ENDIAN。
	 * @getter endian
	 */
	set endian( e = Endian.BIG_ENDIAN ){
		this._endian = e;
	}
	get endian(){
		return this._endian;
	}

	/**
	 * 剩余可读的字节数
	 */
	get readAvailable(){
		return this.write_position - this._position;
	}

	get buffer(){
		return this.data.buffer.slice(0, this.write_position );
	}

	set buffer(value){
		var wpos = value.byteLength;
        var uint8 = new Uint8Array(value);
        var bufferExtSize = this.bufferExtSize;
        var bytes;
        if (bufferExtSize == 0) {
            bytes = new Uint8Array(wpos);
        }
        else {
            var multi = (wpos / bufferExtSize | 0) + 1;
            bytes = new Uint8Array(multi * bufferExtSize);
        }
        bytes.set(uint8);
        this.write_position = wpos;
        this._bytes = bytes;
        this.data = new DataView(bytes.buffer);
	}
	/** 原始buffer,包括 bufferExtSize */
	get rawBuffer(){
		return this.data.buffer;
	}

	get bytes(){
		return this._bytes;
	}

	get dataView(){
		return this.data;
	}

	set dataView( view ){
		this.buffer = view.buffer;
	}
	/**
	* @privite 
	*/
	get bufferOffset(){
		return this.data.byteOffset;
	}
    
    /**
     * 将文件指针的当前位置（以字节为单位）移动或返回到 ByteArray 对象中。下一次调用读取方法时将在此位置开始读取，或者下一次调用写入方法时将在此位置开始写入。
     * @getter
     */
    get position(){
    	return this._position;
    }
    set position( value ){
    	this._position = value;
    	if( value > this.write_position ){
    		this.write_position = value;
    	}
    }
    
    get length(){
    	return this.write_position;
    }
    set length( value ){
    	this.write_position = value;
    	if( this.data.byteLength > value ){
    		this._position = value;
    	}
    	this._validateBuffer( value );
    }

    _validate = function (len) {
        var bl = this._bytes.length;
        if (bl > 0 && this._position + len <= bl) {
            return true;
        }else {
        	throw new Error({code:1025})
        }
    };
    _validateBuffer( length ){
    	if( this.data.byteLength < length ){
    		var be = this.bufferExtSize;
            var tmp = null;
            if (be == 0) {
                tmp = new Uint8Array(length);
            }
            else {
                var nLen = ((length / be >> 0) + 1) * be;
                tmp = new Uint8Array(nLen);
            }
            tmp.set(this._bytes);
            this._bytes = tmp;
            this.data = new DataView(tmp.buffer);
    	}
    }
    /**
     * 可从字节数组的当前位置到数组末尾读取的数据的字节数。
     * @getter
     */
    get bytesAvailable(){
    	return this.data.byteLength - this._position;
    }
    /**
     * 清除字节数组的内容，并将 length 和 position 属性重置为 0。
     */
    clear(){
    	var buffer = new ArrayBuffer(this.bufferExtSize);
        this.data = new DataView(buffer);
        this._bytes = new Uint8Array(buffer);
        this._position = 0;
        this.write_position = 0;
    }
    /**
     * 从字节流中读取布尔值。读取单个字节，如果字节非零，则返回 true，否则返回 false
     * @return 如果字节不为零，则返回 true，否则返回 false
     */
    readBoolean(){
    	if (this._validate(1 /* SIZE_OF_BOOLEAN */)){
    		return !!this._bytes[this.position++];
    	}
    }
    
    /**
     * 从字节流中读取带符号的字节
     * @return 介于 -128 和 127 之间的整数
     */
    readByte() {
        if (this._validate(1 /* SIZE_OF_INT8 */)){
        	return this.data.getInt8(this.position++);
        }
    };
    /**
     * 从字节流中读取 length 参数指定的数据字节数。从 offset 指定的位置开始，将字节读入 bytes 参数指定的 ByteArray 对象中，并将字节写入目标 ByteArray 中
     * @param {ByteArray} bytes - 要将数据读入的 ByteArray 对象
     * @param {int} offset - bytes 中的偏移（位置），应从该位置写入读取的数据
     * @param {int} length - 要读取的字节数。默认值 0 导致读取所有可用的数据
     */
    readBytes(bytes, offset, length) {
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = 0; }
        if (!bytes) {
            return;
        }
        var pos = this._position;
        var available = this.write_position - pos;
        if (available < 0) {
            throw new Error({code:1025})
            return;
        }
        if (length == 0) {
            length = available;
        }
        else if (length > available) {
            throw new Error({code:1025})
            return;
        }
        var position = bytes._position;
        bytes._position = 0;
        bytes.validateBuffer(offset + length);
        bytes._position = position;
        bytes._bytes.set(this._bytes.subarray(pos, pos + length), offset);
        this.position += length;
    };
    
    /**
     * 从字节流中读取一个 IEEE 754 双精度（64 位）浮点数
     * @return 双精度（64 位）浮点数
     */
    readDouble() {
        if (this._validate(8 /* SIZE_OF_FLOAT64 */)) {
            var value = this.data.getFloat64(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 8 /* SIZE_OF_FLOAT64 */;
            return value;
        }
    };
    
    /**
     * 从字节流中读取一个 IEEE 754 单精度（32 位）浮点数
     * @return 单精度（32 位）浮点数
     */
    readFloat() {
        if (this.validate(4 /* SIZE_OF_FLOAT32 */)) {
            var value = this.data.getFloat32(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 4 /* SIZE_OF_FLOAT32 */;
            return value;
        }
    };
    
    /**
     * 从字节流中读取一个带符号的 32 位整数
     * @return 介于 -2147483648 和 2147483647 之间的 32 位带符号整数
     */
    readInt() {
        if (this.validate(4 /* SIZE_OF_INT32 */)) {
            var value = this.data.getInt32(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 4 /* SIZE_OF_INT32 */;
            return value;
        }
    };
    /**
     * 从字节流中读取一个带符号的 16 位整数
     * @return 介于 -32768 和 32767 之间的 16 位带符号整数
     */
    readShort() {
        if (this.validate(2 /* SIZE_OF_INT16 */)) {
            var value = this.data.getInt16(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 2 /* SIZE_OF_INT16 */;
            return value;
        }
    };
    
    /**
     * 从字节流中读取无符号的字节
     * @return 介于 0 和 255 之间的无符号整数
     */
    readUnsignedByte() {
        if (this.validate(1 /* SIZE_OF_UINT8 */)){
        	return this._bytes[this.position++];
        }
    };
    /**
     * 从字节流中读取一个无符号的 32 位整数
     * @return 介于 0 和 4294967295 之间的 32 位无符号整数
     */
    readUnsignedInt() {
        if (this.validate(4 /* SIZE_OF_UINT32 */)) {
            var value = this.data.getUint32(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 4 /* SIZE_OF_UINT32 */;
            return value;
        }
    };
    /**
     * 从字节流中读取一个无符号的 16 位整数
     * @return 介于 0 和 65535 之间的 16 位无符号整数
     */
    readUnsignedShort() {
        if (this.validate(2 /* SIZE_OF_UINT16 */)) {
            var value = this.data.getUint16(this._position, this._endian == Endian.LITTLE_ENDIAN );
            this.position += 2 /* SIZE_OF_UINT16 */;
            return value;
        }
    };
    
    /**
     * 从字节流中读取一个 UTF-8 字符串。假定字符串的前缀是无符号的短整型（以字节表示长度）
     * @return UTF-8 编码的字符串    
     */
    readUTF() {
        var length = this.readUnsignedShort();
        if (length > 0) {
            return this.readUTFBytes(length);
        }
        else {
            return "";
        }
    };
    /**
     * 从字节流中读取一个由 length 参数指定的 UTF-8 字节序列，并返回一个字符串
     * @param length 指明 UTF-8 字节长度的无符号短整型数
     * @return 由指定长度的 UTF-8 字节组成的字符串
     */
    readUTFBytes(length) {
        if (!this.validate(length)) {
            return;
        }
        var data = this.data;
        var bytes = new Uint8Array(data.buffer, data.byteOffset + this._position, length);
        this.position += length;
        return this.decodeUTF8(bytes);
    };    
    /**
     * 写入布尔值。根据 value 参数写入单个字节。如果为 true，则写入 1，如果为 false，则写入 0
     * @param value 确定写入哪个字节的布尔值。如果该参数为 true，则该方法写入 1；如果该参数为 false，则该方法写入 0
     * @version Egret 2.4
     * @platform Web,Native
     * @language zh_CN
     */
    writeBoolean(value) {
        this.validateBuffer(1 /* SIZE_OF_BOOLEAN */);
        this._bytes[this.position++] = +value;
    };    
    /**
     * 在字节流中写入一个字节
     * 使用参数的低 8 位。忽略高 24 位
     * @param value 一个 32 位整数。低 8 位将被写入字节流
     */
    writeByte(value) {
        this.validateBuffer(1 /* SIZE_OF_INT8 */);
        this._bytes[this.position++] = value & 0xff;
    };
    
    /**
     * 将指定字节数组 bytes（起始偏移量为 offset，从零开始的索引）中包含 length 个字节的字节序列写入字节流
     * 如果省略 length 参数，则使用默认长度 0；该方法将从 offset 开始写入整个缓冲区。如果还省略了 offset 参数，则写入整个缓冲区
     * 如果 offset 或 length 超出范围，它们将被锁定到 bytes 数组的开头和结尾
     * @param bytes ByteArray 对象
     * @param offset 从 0 开始的索引，表示在数组中开始写入的位置
     * @param length 一个无符号整数，表示在缓冲区中的写入范围
     */
    writeBytes(bytes, offset, length) {
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = 0; }
        var writeLength;
        if (offset < 0) {
            return;
        }
        if (length < 0) {
            return;
        }
        else if (length == 0) {
            writeLength = bytes.length - offset;
        }
        else {
            writeLength = Math.min(bytes.length - offset, length);
        }
        if (writeLength > 0) {
            this.validateBuffer(writeLength);
            this._bytes.set(bytes._bytes.subarray(offset, offset + writeLength), this._position);
            this.position = this._position + writeLength;
        }
    };    
    /**
     * 在字节流中写入一个 IEEE 754 双精度（64 位）浮点数
     * @param value 双精度（64 位）浮点数
     * @version Egret 2.4
     * @platform Web,Native
     * @language zh_CN
     */
    writeDouble(value) {
        this.validateBuffer(8 /* SIZE_OF_FLOAT64 */);
        this.data.setFloat64(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 8 /* SIZE_OF_FLOAT64 */;
    };    
    /**
     * 在字节流中写入一个 IEEE 754 单精度（32 位）浮点数
     * @param value 单精度（32 位）浮点数
     */
    writeFloat(value) {
        this.validateBuffer(4 /* SIZE_OF_FLOAT32 */);
        this.data.setFloat32(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 4 /* SIZE_OF_FLOAT32 */;
    };    
    /**
     * 在字节流中写入一个带符号的 32 位整数
     * @param value 要写入字节流的整数
     */
    writeInt(value) {
        this.validateBuffer(4 /* SIZE_OF_INT32 */);
        this.data.setInt32(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 4 /* SIZE_OF_INT32 */;
    };    
    /**
     * 在字节流中写入一个 16 位整数。使用参数的低 16 位。忽略高 16 位
     * @param value 32 位整数，该整数的低 16 位将被写入字节流
     */
    writeShort(value) {
        this.validateBuffer(2 /* SIZE_OF_INT16 */);
        this.data.setInt16(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 2 /* SIZE_OF_INT16 */;
    };
    
    /**
     * 在字节流中写入一个无符号的 32 位整数
     * @param value 要写入字节流的无符号整数
     */
    writeUnsignedInt(value) {
        this.validateBuffer(4 /* SIZE_OF_UINT32 */);
        this.data.setUint32(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 4 /* SIZE_OF_UINT32 */;
    };
    /**
     * 在字节流中写入一个无符号的 16 位整数
     * @param value 要写入字节流的无符号整数
     */
    writeUnsignedShort = function (value) {
        this.validateBuffer(2 /* SIZE_OF_UINT16 */);
        this.data.setUint16(this._position, value, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 2 /* SIZE_OF_UINT16 */;
    };    
    /**
     * 将 UTF-8 字符串写入字节流。先写入以字节表示的 UTF-8 字符串长度（作为 16 位整数），然后写入表示字符串字符的字节
     * @param value 要写入的字符串值    
     */
    writeUTF = function (value) {
        var utf8bytes = this.encodeUTF8(value);
        var length = utf8bytes.length;
        this.validateBuffer(2 /* SIZE_OF_UINT16 */ + length);
        this.data.setUint16(this._position, length, this._endian == Endian.LITTLE_ENDIAN );
        this.position += 2 /* SIZE_OF_UINT16 */;
        this._writeUint8Array(utf8bytes, false);
    };    
    /**
     * 将 UTF-8 字符串写入字节流。类似于 writeUTF() 方法，但 writeUTFBytes() 不使用 16 位长度的词为字符串添加前缀
     * @param value 要写入的字符串值    
     */
    writeUTFBytes(value) {
        this._writeUint8Array(this.encodeUTF8(value));
    };
    /**
     *
     * @returns
     */
    toString() {
        return "[ByteArray] length:" + this.length + ", bytesAvailable:" + this.bytesAvailable;
    };
    /**
     * @private
     * 将 Uint8Array 写入字节流
     * @param {Uint8Array} bytes - 要写入的Uint8Array
     * @param validateBuffer
     */
    _writeUint8Array(bytes, validateBuffer) {
        if (validateBuffer === void 0) { validateBuffer = true; }
        var pos = this._position;
        var npos = pos + bytes.length;
        if (validateBuffer) {
            this.validateBuffer(npos);
        }
        this.bytes.set(bytes, pos);
        this.position = npos;
    };
    
    /**********************/
    /*  PRIVATE METHODS   */
    /**********************/
    /**
     * @private
     * @param len
     * @param needReplace
     */
    validateBuffer(len) {
        this.write_position = len > this.write_position ? len : this.write_position;
        len += this._position;
        this._validateBuffer(len);
    };
    /**
     * @private
     * UTF-8 Encoding/Decoding
     */
    encodeUTF8(str) {
        var pos = 0;
        var codePoints = this.stringToCodePoints(str);
        var outputBytes = [];
        while (codePoints.length > pos) {
            var code_point = codePoints[pos++];
            if (this.inRange(code_point, 0xD800, 0xDFFF)) {
                this.encoderError(code_point);
            }
            else if (this.inRange(code_point, 0x0000, 0x007f)) {
                outputBytes.push(code_point);
            }
            else {
                var count = void 0, offset = void 0;
                if (this.inRange(code_point, 0x0080, 0x07FF)) {
                    count = 1;
                    offset = 0xC0;
                }
                else if (this.inRange(code_point, 0x0800, 0xFFFF)) {
                    count = 2;
                    offset = 0xE0;
                }
                else if (this.inRange(code_point, 0x10000, 0x10FFFF)) {
                    count = 3;
                    offset = 0xF0;
                }
                outputBytes.push(this.div(code_point, Math.pow(64, count)) + offset);
                while (count > 0) {
                    var temp = this.div(code_point, Math.pow(64, count - 1));
                    outputBytes.push(0x80 + (temp % 64));
                    count -= 1;
                }
            }
        }
        return new Uint8Array(outputBytes);
    };
    /**
     * @private
     *
     * @param data
     * @returns
     */
    decodeUTF8(data) {
        var fatal = false;
        var pos = 0;
        var result = "";
        var code_point;
        var utf8_code_point = 0;
        var utf8_bytes_needed = 0;
        var utf8_bytes_seen = 0;
        var utf8_lower_boundary = 0;
        while (data.length > pos) {
            var _byte = data[pos++];
            if (_byte == this.EOF_byte) {
                if (utf8_bytes_needed != 0) {
                    code_point = this.decoderError(fatal);
                }
                else {
                    code_point = this.EOF_code_point;
                }
            }
            else {
                if (utf8_bytes_needed == 0) {
                    if (this.inRange(_byte, 0x00, 0x7F)) {
                        code_point = _byte;
                    }
                    else {
                        if (this.inRange(_byte, 0xC2, 0xDF)) {
                            utf8_bytes_needed = 1;
                            utf8_lower_boundary = 0x80;
                            utf8_code_point = _byte - 0xC0;
                        }
                        else if (this.inRange(_byte, 0xE0, 0xEF)) {
                            utf8_bytes_needed = 2;
                            utf8_lower_boundary = 0x800;
                            utf8_code_point = _byte - 0xE0;
                        }
                        else if (this.inRange(_byte, 0xF0, 0xF4)) {
                            utf8_bytes_needed = 3;
                            utf8_lower_boundary = 0x10000;
                            utf8_code_point = _byte - 0xF0;
                        }
                        else {
                            this.decoderError(fatal);
                        }
                        utf8_code_point = utf8_code_point * Math.pow(64, utf8_bytes_needed);
                        code_point = null;
                    }
                }
                else if (!this.inRange(_byte, 0x80, 0xBF)) {
                    utf8_code_point = 0;
                    utf8_bytes_needed = 0;
                    utf8_bytes_seen = 0;
                    utf8_lower_boundary = 0;
                    pos--;
                    code_point = this.decoderError(fatal, _byte);
                }
                else {
                    utf8_bytes_seen += 1;
                    utf8_code_point = utf8_code_point + (_byte - 0x80) * Math.pow(64, utf8_bytes_needed - utf8_bytes_seen);
                    if (utf8_bytes_seen !== utf8_bytes_needed) {
                        code_point = null;
                    }
                    else {
                        var cp = utf8_code_point;
                        var lower_boundary = utf8_lower_boundary;
                        utf8_code_point = 0;
                        utf8_bytes_needed = 0;
                        utf8_bytes_seen = 0;
                        utf8_lower_boundary = 0;
                        if (this.inRange(cp, lower_boundary, 0x10FFFF) && !this.inRange(cp, 0xD800, 0xDFFF)) {
                            code_point = cp;
                        }
                        else {
                            code_point = this.decoderError(fatal, _byte);
                        }
                    }
                }
            }
            //Decode string
            if (code_point !== null && code_point !== this.EOF_code_point) {
                if (code_point <= 0xFFFF) {
                    if (code_point > 0)
                        result += String.fromCharCode(code_point);
                }
                else {
                    code_point -= 0x10000;
                    result += String.fromCharCode(0xD800 + ((code_point >> 10) & 0x3ff));
                    result += String.fromCharCode(0xDC00 + (code_point & 0x3ff));
                }
            }
        }
        return result;
    };
    /**
     * @private
     *
     * @param code_point
     */
    encoderError(code_point) {
        //egret.$error(1026, code_point);
        throw new Error({code:1026,lines:code_point})
    };
    /**
     * @private
     *
     * @param fatal
     * @param opt_code_point
     * @returns
     */
    decoderError(fatal, opt_code_point) {
        if (fatal) {
            //egret.$error(1027);
        }
        return opt_code_point || 0xFFFD;
    };
    /**
     * @private
     *
     * @param a
     * @param min
     * @param max
     */
    inRange(a, min, max) {
        return min <= a && a <= max;
    };
    /**
     * @private
     *
     * @param n
     * @param d
     */
    div(n, d) {
        return Math.floor(n / d);
    };
    /**
     * @private
     *
     * @param string
     */
    stringToCodePoints(string) {
        /** @type {Array.<number>} */
        var cps = [];
        // Based on http://www.w3.org/TR/WebIDL/#idl-DOMString
        var i = 0, n = string.length;
        while (i < string.length) {
            var c = string.charCodeAt(i);
            if (!this.inRange(c, 0xD800, 0xDFFF)) {
                cps.push(c);
            }
            else if (this.inRange(c, 0xDC00, 0xDFFF)) {
                cps.push(0xFFFD);
            }
            else {
                if (i == n - 1) {
                    cps.push(0xFFFD);
                }
                else {
                    var d = string.charCodeAt(i + 1);
                    if (this.inRange(d, 0xDC00, 0xDFFF)) {
                        var a = c & 0x3FF;
                        var b = d & 0x3FF;
                        i += 1;
                        cps.push(0x10000 + (a << 10) + b);
                    }
                    else {
                        cps.push(0xFFFD);
                    }
                }
            }
            i += 1;
        }
        return cps;
    }

}

export default ByteArray;