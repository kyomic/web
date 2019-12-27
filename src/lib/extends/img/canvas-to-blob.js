/*
 * JavaScript Canvas to Blob
 * https://github.com/blueimp/JavaScript-Canvas-to-Blob
 *
 * Copyright 2012, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on stackoverflow user Stoive's code snippet:
 * http://stackoverflow.com/q/4998908
 */

/* global define, Uint8Array, ArrayBuffer, module */


/**
 * 
 * let dataURLtoBlob = require('./canvas-to-blob.js')

 * exmaple 1:
 
  var canvas = document.createElement('canvas')
  if (canvas.toBlob) {
    canvas.toBlob(function(blob) {
      // Do something with the blob object,
      // e.g. creating a multipart form for file uploads:
      var formData = new FormData()
      formData.append('file', blob, fileName)
      // ...
    }, 'image/jpeg')
  }

  * example 2:

  // 80x60px GIF image (color black, base64 data):
  var b64Data =
      'R0lGODdhUAA8AIABAAAAAP///ywAAAAAUAA8AAACS4SPqcvtD6' +
      'OctNqLs968+w+G4kiW5omm6sq27gvH8kzX9o3n+s73/g8MCofE' +
      'ovGITCqXzKbzCY1Kp9Sq9YrNarfcrvcLDovH5PKsAAA7',
    imageUrl = 'data:image/gif;base64,' + b64Data,
    blob = window.dataURLtoBlob && window.dataURLtoBlob(imageUrl)

 */
//;(function(window) {
  'use strict'

  var CanvasPrototype =
    window.HTMLCanvasElement && window.HTMLCanvasElement.prototype
  var hasBlobConstructor =
    window.Blob &&
    (function() {
      try {
        return Boolean(new Blob())
      } catch (e) {
        return false
      }
    })()
  var hasArrayBufferViewSupport =
    hasBlobConstructor &&
    window.Uint8Array &&
    (function() {
      try {
        return new Blob([new Uint8Array(100)]).size === 100
      } catch (e) {
        return false
      }
    })()
  var BlobBuilder =
    window.BlobBuilder ||
    window.WebKitBlobBuilder ||
    window.MozBlobBuilder ||
    window.MSBlobBuilder
  var dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/
  var dataURLtoBlob =
    (hasBlobConstructor || BlobBuilder) &&
    window.atob &&
    window.ArrayBuffer &&
    window.Uint8Array &&
    function(dataURI) {
      var matches,
        mediaType,
        isBase64,
        dataString,
        byteString,
        arrayBuffer,
        intArray,
        i,
        bb
      // Parse the dataURI components as per RFC 2397
      matches = dataURI.match(dataURIPattern)
      if (!matches) {
        throw new Error('invalid data URI')
      }
      // Default to text/plain;charset=US-ASCII
      mediaType = matches[2]
        ? matches[1]
        : 'text/plain' + (matches[3] || ';charset=US-ASCII')
      isBase64 = !!matches[4]
      dataString = dataURI.slice(matches[0].length)
      if (isBase64) {
        // Convert base64 to raw binary data held in a string:
        byteString = atob(dataString)
      } else {
        // Convert base64/URLEncoded data component to raw binary:
        byteString = decodeURIComponent(dataString)
      }
      // Write the bytes of the string to an ArrayBuffer:
      arrayBuffer = new ArrayBuffer(byteString.length)
      intArray = new Uint8Array(arrayBuffer)
      for (i = 0; i < byteString.length; i += 1) {
        intArray[i] = byteString.charCodeAt(i)
      }
      // Write the ArrayBuffer (or ArrayBufferView) to a blob:
      if (hasBlobConstructor) {
        return new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
          type: mediaType
        })
      }
      bb = new BlobBuilder()
      bb.append(arrayBuffer)
      return bb.getBlob(mediaType)
    }
  if (window.HTMLCanvasElement && !CanvasPrototype.toBlob) {
    if (CanvasPrototype.mozGetAsFile) {
      CanvasPrototype.toBlob = function(callback, type, quality) {
        var self = this
        setTimeout(function() {
          if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
            callback(dataURLtoBlob(self.toDataURL(type, quality)))
          } else {
            callback(self.mozGetAsFile('blob', type))
          }
        })
      }
    } else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
      CanvasPrototype.toBlob = function(callback, type, quality) {
        var self = this
        setTimeout(function() {
          callback(dataURLtoBlob(self.toDataURL(type, quality)))
        })
      }
    }
  }

  var arrayBufferToBlob = function( buffer, mimetype ){
    if ( BlobBuilder ) {
      var bb = new BlobBuilder();
      bb.append( buffer );
      return bb.getBlob( mimetype );
    }
    return new Blob([ buffer ], mimetype ? { type: mimetype } : {} );
  }

  var dataURLtoArrayBuffer = function( dataURI ){
    var byteStr, intArray, ab, i, mimetype, parts;
    parts = dataURI.split(',');
    if ( ~parts[ 0 ].indexOf('base64') ) {
        byteStr = atob( parts[ 1 ] );
    } else {
        byteStr = decodeURIComponent( parts[ 1 ] );
    }
    ab = new ArrayBuffer( byteStr.length );
    intArray = new Uint8Array( ab );
    for ( i = 0; i < byteStr.length; i++ ) {
      intArray[ i ] = byteStr.charCodeAt( i );
    }
    mimetype = parts[ 0 ].split(':')[ 1 ].split(';')[ 0 ];
    return arrayBufferToBlob( ab, mimetype );
  }

  /** 
   * 将blob转为字符
   * @example
   * var blob = new Blob(['中文字符串'], { type: 'text/plain' });
   * var buffer = blobtoArrayBuffer(blob);
   */
  var blobtoArrayBuffer = function( blob ){
    return new Promise((resolve,reject)=>{
      var reader = new FileReader();
      //byte为blob对象 
      reader.onload= function(e){
        console.log('result', reader.result)
        var buf = new Uint8Array(reader.result);
        resolve( buf );
      }
      reader.onerror = function(e){
        reject(e);
      }
      reader.readAsArrayBuffer( blob );      
    })
  }

  var blobtoText = function( blob, encoding='utf-8'){
    return new Promise((resolve,reject)=>{
      var reader = new FileReader();
      reader.onload= function(e){
        resolve( reader.result );
      }
      reader.onerror = function(e){
        reject(e);
      }
      reader.readAsText( blob, encoding );      
    })
  }
  /*

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return dataURLtoBlob
    })
  } else if (typeof module === 'object' && module.exports) {
    module.exports = dataURLtoBlob
  } else {
    window.dataURLtoBlob = dataURLtoBlob
  }
})(window)
*/

//es6
export default dataURLtoBlob;
export {
  dataURLtoBlob,
  arrayBufferToBlob,
  dataURLtoArrayBuffer,
  blobtoArrayBuffer,
  blobtoText
}
