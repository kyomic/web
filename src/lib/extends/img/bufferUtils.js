let bufferUtils = {}

bufferUtils.Uint8ArrayToString = (fileData)=>{
  var dataString = "";
  for (var i = 0; i < fileData.length; i++) {
    dataString += String.fromCharCode(fileData[i]);
  }
  return dataString;
}

bufferUtils.stringToUint8Array = (str)=>{
  var arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  } 
  return new Uint8Array(arr);
}

bufferUtils.intTobytes2 = (n)=> {
  var bytes = [];
 
  for (var i = 0; i < 2; i++) {
    bytes[i] = n >> (8 - i * 8);
 
  }
  return bytes;
}

bufferUtils.intToByte = (i)=>{
    var b = i & 0xFF;
    var c = 0;
    if (b >= 128) {
        c = b % 128;
        c = -1 * (128 - c);
    } else {
        c = b;
    }
    return c;
}
export default bufferUtils;