# file-lockdown: Library that handle file locking.

[![npm-version](https://badgen.net/npm/v/file-lockdown)](https://www.npmjs.com/package/file-lockdown)
[![npm-week-downloads](https://badgen.net/npm/dw/file-lockdown)](https://www.npmjs.com/package/file-lockdown)

Library that handle file locking.
The library is designed for ['fs-broker'](https://www.npmjs.com/package/fs-broker).
Allows you to communicate with background processes over the 'net' module.
The callback APIs perform all operations asynchronously, without blocking the event loop, then invoke a callback function upon completion or error.

## Installation

`npm install file-lockdown`

## Usage example

```js
var file_lock = require("file-lockdown");
setTimeout(function () {
    file_lock.lockAppendFile("./test.txt", "1 test\r\n", function (err) {
        if (err) { console.error(err); }
    });
}, 100);
```

## 'file-lockdown' Reference

```js
/**
 * @param {string} filePath
 * @param {(err:any,callback:(err:any,fnUnlock:()void)void)void} callback function(err,fnUnlock()=>void){...}
 * @param {number} timeout Default: 500ms
 */
function lockFile(filePath, callback, timeout = 500)

/**
 * @param {string} filePath
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockReadFile(filePath, callback, encoding = "utf8", timeout)

/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8", timeout)

/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockReadWriteFile(filePath, callback, encoding = "utf8", timeout)

/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8", timeout)

/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8", timeout)

/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 * @param {number} timeout
 */
function lockDeleteFile(filePath, callback, timeout)

/**
 * @param {string} filePath
 * @param {string} newPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockRename(filePath, newPath, callback, timeout)

/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockCreateDir(dirPath, callback, timeout)

/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockDeleteDir(dirPath, callback, timeout)

/**
 * @param {string} path
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockAccess(path, callback, timeout)
```

## License


The MIT License [MIT](LICENSE)
```txt
The MIT License (MIT)

Copyright (c) 2021 Manuel Lõhmus <manuel@hauss.ee>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

