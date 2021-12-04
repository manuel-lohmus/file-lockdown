/**File locking functions. @preserve Copyright (c) 2021 Manuel Lõhmus.*/
"use strict";

var options = require("config-sets").init({
    file_lockdown: {
        ipc_port: 8021,
        ipc_host: "localhost"
    }
}).file_lockdown;

//#region File locking functions

var fs = require("fs");
var lockFiles = {};

/**
 * @param {string} filePath
 * @param {(err:any,callback:(err:any,fnUnlock:()void)void)void} callback function(err,fnUnlock()=>void){...}
 * @param {number} timeout Default :200ms
 */
function lockFile(filePath, callback, timeout = 200) {

    if (typeof callback !== "function") return;

    timeout = typeof timeout === "number" && timeout > 0 ? timeout : 200;

    if (lockFiles[filePath]) {

        if (lockFiles[filePath] > 5) {

            console.info("File '" + filePath + "' locked. Set timeout: " + timeout + "ms.");
        }

        setTimeout(function () { lockFile(filePath, callback, timeout); }, timeout);
    }
    else {

        lockFiles[filePath] = 1;

        var interval = setInterval(function () {

            lockFiles[filePath]++;

            if (lockFiles[filePath] > 20) {

                clearInterval(interval);
                delete lockFiles[filePath];
                console.info("File locker problem. Timeout! File '" + filePath + "' now unlocked.");
            }

        }, timeout);

        callback(null, function () {

            clearInterval(interval);
            delete lockFiles[filePath];
        });
    }
}
/**
 * @param {string} filePath
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockReadFile(filePath, callback, encoding = "utf8", timeout = 200) {

    lockFile(filePath, function (err, fnUnlock) {

        if (err) { fnRead(err); fnUnlock(); }

        else {

            fs.open(filePath, "r", function (err, fd) {

                function close() {
                    if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                    else { fnUnlock(); }
                }

                if (err) { close(); callback(err); }

                else {

                    var data = Buffer.alloc(0);
                    var buf = Buffer.alloc(1024);
                    var length = fs.readSync(fd, buf, 0, 1024, null);

                    while (length > 0) {

                        data = Buffer.concat([data, buf.subarray(0, length)]);
                        length = fs.readSync(fd, buf, 0, 1024, null);
                    }

                    close();

                    callback(null, data.toString(encoding));
                }
            });
        }

    }, timeout);
}
/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8", timeout = 200) {

    if (buffer !== undefined && buffer !== null) {

        lockFile(filePath, function (err, fnUnlock) {

            if (err) { fnUnlock(); callback(err); }

            else {

                fs.open(filePath, "w+", function (err, fd) {

                    function close() {
                        if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                        else { fnUnlock(); }
                    }

                    if (err) { close(); callback(err); }

                    else {

                        fs.ftruncateSync(fd, 0);
                        var buf = Buffer.from(buffer, encoding);
                        var n = fs.writeSync(fd, buf, 0, buf.length, 0);

                        close();

                        if (buf.length !== n) { callback("Writing error!"); }

                        else { callback(); }
                    }
                });
            }
        }, timeout);
    }
}
/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockReadWriteFile(filePath, fnRead, encoding = "utf8", timeout = 200) {

    lockFile(filePath, function (err, fnUnlock) {

        if (err) { fnUnlock(); fnRead(err); }

        else {

            var flag = fs.existsSync(filePath) ? "r+" : "w+";

            fs.open(filePath, flag, function (err, fd) {

                function close() {
                    if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                    else { fnUnlock(); }
                }

                if (err) { close(); fnRead(err); }

                else {

                    var data = Buffer.alloc(0);
                    var buf = Buffer.alloc(1024);
                    var length = fs.readSync(fd, buf, 0, 1024, null);

                    while (length > 0) {

                        data = Buffer.concat([data, buf.subarray(0, length)]);
                        length = fs.readSync(fd, buf, 0, 1024, null);
                    }

                    fnRead(null, data.toString(encoding), function (str, isTruncated, callback) {

                        if (typeof callback !== "function") { callback = function () { }; }

                        if (str === null) { fnUnlock(); callback(); }

                        else {

                            if (isTruncated) { fs.ftruncateSync(fd, 0); }

                            var buf = Buffer.from(str + "", encoding);
                            var n = fs.writeSync(fd, buf, 0, buf.length, 0);
                            close();

                            if (buf.length !== n) { callback("Writing error!"); }

                            else { callback(); }
                        }
                    });
                }

            });
        }
    }, timeout);
}
/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding
 * @param {number} timeout Default: 200ms
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8", timeout = 200) {

    lockFile(filePath, function (err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            var flag = fs.existsSync(filePath) ? "a" : "w+";

            fs.open(filePath, flag, function (err, fd) {

                function close() {
                    if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                    else { fnUnlock(); }
                }

                if (err) { close(); callback(err); }

                else {

                    var buf = Buffer.from(buffer, encoding);
                    var n = fs.writeSync(fd, buf, 0, null, null);
                    close();

                    if (buf.length !== n) { callback("Writing error!"); }

                    else { callback(); }
                }
            });
        }

    }, timeout);
}
/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 * @param {number} timeout
 */
function lockDeleteFile(filePath, callback, timeout = 200) {

    lockFile(filePath, function (err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else if (!fs.existsSync(filePath)) { fnUnlock(); callback("Error: Path '" + filePath + "' not exists."); }

        else {

            fs.unlink(filePath, function (err) {

                fnUnlock(); callback(err);
            });
        }
    }, timeout);
}
/**
 * @param {string} filePath
 * @param {string} newPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockRename(filePath, newPath, callback, timeout = 200) {

    lockFile(filePath, function (err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else if (!fs.existsSync(filePath)) { fnUnlock(); callback("Error: Path '" + filePath + "' not exists."); }

        else {

            fs.rename(filePath, newPath, function (err) {

                fnUnlock(); callback(err);
            });
        }
    }, timeout);
}
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockCreateDir(dirPath, callback, timeout = 200) {

    lockFile(dirPath, function (err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else if (fs.existsSync(dirPath)) { fnUnlock(); callback("Error: Path '" + dirPath + "' exists."); }

        else {

            fs.mkdir(dirPath, { recursive: true, mode: 0o770 }, function (err, pathDir) {

                fnUnlock(); callback(err);
            });
        }

    }, timeout);
}
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockDeleteDir(dirPath, callback, timeout = 200) {

    lockFile(dirPath, function (err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else if (!fs.existsSync(dirPath)) { fnUnlock(); callback("Error: Path '" + dirPath + "' not exists."); }

        else {

            fs.rmdir(dirPath, { recursive: true }, function (err) {

                fnUnlock(); callback(err);
            });
        }

    }, timeout);
}


//#endregion


var net_fn = require("net-fn");
var fns = [
    lockReadFile,
    lockWriteFile,
    lockReadWriteFile,
    lockAppendFile,
    lockDeleteFile,
    lockRename,
    lockCreateDir,
    lockDeleteDir
];

var fn_exports = net_fn.connect(fns, options.ipc_port, options.ipc_host);
Object.keys(fn_exports).forEach(function (key) { exports[key] = fn_exports[key]; });


//console.log("Starting worker!");
net_fn.tryToRunServer(__filename, options.ipc_port, function (worker) {

    if (worker) {

        exports.worker = worker;
    }
    else {

        //console.log("Starting server!");
        net_fn.createServer(fns, options.ipc_port, function (server) {

            exports.server = server;

        }, options.ipc_host);
    }


}, options.ipc_host);