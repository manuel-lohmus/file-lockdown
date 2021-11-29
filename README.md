# file-lockdown: Library that handle file locking.

[![npm-version](https://badgen.net/npm/v/file-lockdown)](https://www.npmjs.com/package/file-lockdown)
[![npm-week-downloads](https://badgen.net/npm/dw/file-lockdown)](https://www.npmjs.com/package/file-lockdown)

Library that handle file locking.
Allows you to communicate with background processes over the 'net' module.
The callback APIs perform all operations asynchronously, without blocking the event loop, then invoke a callback function upon completion or error.

## Installing

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
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockReadFile(filePath, callback, encoding = "utf8", timeout = 200)

/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8", timeout = 200)

/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockReadWriteFile(filePath, fnRead, encoding = "utf8", timeout = 200)

/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8", timeout = 200)

/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 * @param {number} timeout
 */
function lockDeleteFile(filePath, callback, timeout = 200)

/**
 * @param {string} filePath
 * @param {string} newPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockRename(filePath, newPath, callback, timeout = 200)

/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockCreateDir(dirPath, callback, timeout = 200)

/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockDeleteDir(dirPath, callback, timeout = 200)
```

## License

[MIT](LICENSE)

Copyright (c) 2021 Manuel L&otilde;hmus <manuel@hauss.ee>

