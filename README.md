<div class="row w-100">
<div class="col-lg-3 d-lg-inline">
<div class="sticky-top overflow-auto vh-lg-100">
<div id="list-headers" class="list-group mt-2 ms-lg-2 ms-4">

#### Table of contents
- [**File Lockdown**](#file-lockdown)
- [**Installation**](#installation)
- [**Basic Usage**](#basic-usage)
- [**How It Works**](#how-it-works)
- [**Key Features**](#key-features)
- [**Config Sets**](#config-sets)
- [**Reference**](#reference)
  - [lockFile](#lockfile)
  - [lockReadFile](#lockreadfile)
  - [lockWriteFile](#lockwritefile)
  - [lockReadWriteFile](#lockreadwritefile)
  - [lockAppendFile](#lockappendfile)
  - [lockDeleteFile](#lockdeletefile)
  - [lockRename](#lockrename)
  - [lockCreateDir](#lockcreatedir)
  - [lockDeleteDir](#lockdeletedir)
  - [lockAccess](#lockaccess)
- [**License**](#license)

</div>
</div>
</div>
 
<div class="col-lg-9 mt-2">
<div class="ps-4 markdown-body" data-bs-spy="scroll" data-bs-target="#list-headers" data-bs-offset="0" tabindex="0">

# File Lockdown

**File Lockdown** is a library designed to handle file locking and asynchronous file operations. 
It is built for use with [`fs-broker`](https://www.npmjs.com/package/fs-broker) and allows communication with background processes via the [`net-fn`](https://www.npmjs.com/package/net-fn) module. 
The library ensures thread safety and provides a robust API for managing file operations without blocking the event loop.

This manual is also available in [HTML5 format](https://manuel-lohmus.github.io/file-lockdown/README.html).

---

## Installation
Install the library using npm:

`npm install file-lockdown`

---

## Basic Usage
Here’s a simple example of how to use the library:
```javascript
var file_lock = require("file-lockdown");
setTimeout(function () {
    file_lock.lockAppendFile("./test.txt", "1 test\r\n", function (err) {
        if (err) { console.error(err); }
    });
}, 100);
```

---

## How It Works

The library uses a locking mechanism to ensure that file operations are serialized for the same file. This prevents race conditions and ensures thread safety.

1. A `lockFiles` object tracks the state of locked files.
2. If a file is already locked, the callback is queued.
3. If the file is not locked, it is locked, and queued callbacks are processed sequentially using the `next` function.
4. A `fnUnlock` function is provided to release the lock after the operation is complete.

---

## Key Features

- **Thread Safety**: Ensures that file operations are serialized for the same file.
- **Asynchronous Operations**: All operations are non-blocking and use callbacks.
- **IPC Support**: Allows communication with background processes via the `net` module.
- **Configurable Behavior**: Options like `enableSyncWrites` provide flexibility for synchronous or asynchronous writes.

---

## Config Sets

- **enableSyncWrites**: Enable synchronous writing. This is safer than asynchronous writing. (added with version 1.2)
- **ipc_port**: Port number. See more about [`net-fn`](https://www.npmjs.com/package/net-fn) connection.
- **ipc_host**: Hostname.See more about [`net-fn`](https://www.npmjs.com/package/net-fn) connection.

```json
{
  "production": {
    "file_lockdown": {
      "enableSyncWrites": false,
      "ipc_port": 8021,
      "ipc_host": "localhost"
    }
  }
}
```

## Reference
Below is a list of the available functions and their usage:

### `lockFile`
Locks a file for exclusive access.
```javascript
/**
 * @param {string} filePath
 * @param {(err:any,callback:(err:any,fnUnlock:()void)void)void} callback function(err,fnUnlock()=>void){...}
 */
function lockFile(filePath, callback)
```

### `lockReadFile`
Reads a file while ensuring it is locked during the operation.
```javascript
/**
 * @param {string} filePath
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding Default: "utf8"
 */
function lockReadFile(filePath, callback, encoding = "utf8")
```

### `lockWriteFile`
Writes data to a file, optionally truncating it first.
```javascript
/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8")
```

### `lockReadWriteFile`
Combines reading and writing operations on a file.
```javascript
/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding Default: "utf8"
 */
function lockReadWriteFile(filePath, callback, encoding = "utf8",)
```

### `lockAppendFile`
Appends data to a file, creating it if it doesn't exist.
```javascript
/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8")
```

### `lockDeleteFile`
Deletes a file.
```javascript
/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 */
function lockDeleteFile(filePath, callback)
```

### `lockRename`
Renames a file.
```javascript
/**
 * @param {string} filePath
 * @param {string} newPath
 * @param {(err:any)void} callback
 */
function lockRename(filePath, newPath, callback)
```

### `lockCreateDir`
Creates a directory recursively.
```javascript
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 */
function lockCreateDir(dirPath, callback)
```

### `lockDeleteDir`
Deletes a directory recursively.
```javascript
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 */
function lockDeleteDir(dirPath, callback)
```

### `lockAccess`
Checks if a file or directory exists.
```javascript
/**
 * @param {string} path
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockAccess(path, callback, timeout)
```

## License

This project is licensed under the MIT License.

Copyright &copy; Manuel Lõhmus

<br>
<br>
<br>
</div>
</div>
</div>

