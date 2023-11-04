/**File locking functions. @preserve Copyright (c) 2021 Manuel Lõhmus.*/
"use strict";

var confSet = require("config-sets");
var options = confSet.init({
    file_lockdown: {
        ipc_port: 8021,
        ipc_host: "localhost"
    }
}).file_lockdown;
exports.options = options;
var isDebug = Boolean(confSet && confSet.isDebug);

//#region File locking functions

var fs = require("node:fs");
var lockFiles = {};

/**
 * @param {string} filePath
 * @param {(err:any,callback:(err:any,fnUnlock:()void)void)void} callback function(err,fnUnlock()=>void){...}
 * @param {number} timeout Default: 500ms
 */
function lockFile(filePath, callback, timeout = 500) {

    if (typeof callback !== "function") return;

    timeout = typeof timeout === "number" && timeout > 0 ? timeout : 500;

    if (lockFiles[filePath]) {

        lockFiles[filePath].push(callback);
    }
    else {

        lockFiles[filePath] = [];

        function fnLock(callback) {

            function fnUnlock() {

                if (callback.timeout === undefined) { return; }

                clearTimeout(callback.timeout);
                delete callback.timeout;

                var cb = lockFiles[filePath].shift();

                if (cb) { setImmediate(function () { fnLock(cb); }); }
                else { delete lockFiles[filePath]; }
            }
            function setWatching() {

                callback.timeout = setTimeout(function () {

                    console.info("[ INFO ] 'file-lockdown' File locker problem. Timeout! File '" + filePath + "' now unlocked.");
                    //console.info("[ INFO ] 'file-lockdown' File locker problem. Timeout! '" + callback.name + "' File '" + filePath + "' callbacks:", lockFiles[filePath].length);
                    callback("[ ERROR ] 'file-lockdown' File locker problem. Timeout!", fnUnlock);
                    fnUnlock();

                }, timeout);
            }

            setImmediate(function () { setWatching(); callback(null, fnUnlock); });
        }

        fnLock(callback);
    }
}
/**
 * @param {string} filePath
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockReadFile(filePath, callback, encoding = "utf8", timeout) {

    lockFile(filePath, function readFile(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            fs.open(filePath, "r", function (err, fd) {

                function close() {
                    if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                    else { fnUnlock(); }
                }

                if (err) { close(); callback(err); }

                else {

                    function cb(err, bytesRead, buffer) {

                        if (err) { close(); callback(err); }
                        else {

                            str += buffer.toString(encoding, 0, bytesRead);

                            if (buffer[buffer.byteLength - 1] !== 0) {

                                position += bytesRead;
                                fs.read(fd, { position: position }, cb);
                            }
                            else {

                                close();
                                callback(null, str);

                            }
                        }
                    }

                    var str = "", position = 0;
                    fs.read(fd, { position: position }, cb);
                }
            });
        }

    }, timeout);
}
/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8", timeout) {

    if (buffer !== undefined && buffer !== null) {

        lockFile(filePath, function writeFile(err, fnUnlock) {

            if (err) { fnUnlock(); callback(err); }

            else {

                fs.open(filePath, "w+", function (err, fd) {

                    function close() {
                        if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                        else { fnUnlock(); }
                    }
                    function write(err) {

                        if (err) { close(); callback(err); }

                        else {
                            fs.write(fd, buffer, 0, encoding, function (err) {

                                close();
                                callback(err);
                            });
                        }
                    }

                    if (err) { close(); callback(err); }

                    else { fs.ftruncate(fd, 0, write); }
                });
            }
        }, timeout);
    }
    else { callback(new Error('Wrong buffer value.')); }
}
/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockReadWriteFile(filePath, callback, encoding = "utf8", timeout) {

    lockFile(filePath, function readWriteFile(err, fnUnlock) {

        if (err) {
            fnUnlock();
            callback(err);
        }

        else {

            fs.access(filePath, fs.constants.F_OK, function (err) {

                var flag = err ? "w+" : "r+";

                function fnOpen(filePath, flag, openCallback) {

                    fs.open(filePath, flag, function (err, fd) {

                        function fnClose(closeCallback) {

                            if (typeof closeCallback !== "function") { closeCallback = function () { }; }
                            if (typeof fd === "number") {

                                fs.close(fd, function (err) {
                                    closeCallback(err);
                                });
                            }
                            else {
                                closeCallback(new Error("Error closing file."));
                            }
                        }

                        if (err) {
                            fnClose();
                            openCallback(err);
                        }
                        else {
                            openCallback(null, fd, fnClose);
                        }
                    });
                }
                function fnWriteClose(str, isTruncated, writeCallback) {

                    // Write file
                    fnOpen(filePath, flag, function (err, fd, fnClose) {

                        if (err) {
                            fnClose();
                            fnUnlock();
                            writeCallback(err);
                        }
                        else {

                            function fnWrite(err) {

                                if (err) {
                                    fnUnlock();
                                    writeCallback(err);
                                }
                                else if (typeof str === 'string') {

                                    fs.write(fd, str, 0, encoding, function (err) {

                                        fnClose();
                                        fnUnlock();
                                        writeCallback(err);
                                    });
                                }
                                else {
                                    fnUnlock();
                                    writeCallback(new Error("fnWrite error: typeof str === 'string' > " + typeof str));
                                }
                            }

                            if (typeof writeCallback !== "function") { writeCallback = function () { }; }

                            if (str === null) {
                                fnUnlock();
                                writeCallback();
                            }
                            else if (isTruncated) { fs.ftruncate(fd, 0, fnWrite); }
                            else { fnWrite(); }
                        }
                    });
                }

                // Read file
                fnOpen(filePath, flag, function (err, fd, fnClose) {

                    if (err) {
                        fnClose();
                        fnUnlock();
                        callback(err);
                    }
                    else {

                        function cb(err, bytesRead, buffer) {

                            if (err) {
                                fnClose();
                                fnUnlock();
                                callback(err);
                            }
                            else {

                                str += buffer.toString(encoding, 0, bytesRead);

                                if (buffer[buffer.byteLength - 1] !== 0) {

                                    position += bytesRead;
                                    fs.read(fd, { position: position }, cb);
                                }
                                else {
                                    fnClose();
                                    callback(null, str, fnWriteClose);

                                }
                            }
                        }

                        var str = "", position = 0;
                        fs.read(fd, { position: position }, cb);
                    }
                });
            });
        }

    }, timeout);
}
/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 * @param {number} timeout 
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8", timeout) {

    if (buffer !== undefined && buffer !== null) {

        lockFile(filePath, function appendFile(err, fnUnlock) {

            if (err) { fnUnlock(); callback(err); }

            else {

                fs.access(filePath, fs.constants.F_OK, function (err) {

                    var flag = err ? "w+" : "a";

                    fs.open(filePath, flag, function (err, fd) {

                        function close() {
                            if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                            else { fnUnlock(); }
                        }

                        if (err) { close(); callback(err); }

                        else {

                            var buf = Buffer.from(buffer, encoding);

                            fs.write(fd, buf, 0, null, null, function (err) {

                                close();
                                callback(err);
                            });
                        }
                    });

                });
            }

        }, timeout);
    }
    else { callback(new Error('Wrong buffer value.')); }
}
/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 * @param {number} timeout
 */
function lockDeleteFile(filePath, callback, timeout) {

    lockFile(filePath, function deleteFile(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            //fs.unlink(filePath, function (err) {

            //    fnUnlock(); callback(err);
            //});

            fs.rm(filePath, function (err) {

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
function lockRename(filePath, newPath, callback, timeout) {

    lockFile(filePath, function rename(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            fs.rename(filePath, newPath, function (err) {

                fnUnlock(); callback(err);
            });
        }
    }, timeout);
}
/**
 * @param {string} dirPath
 * @param {(err:any, pathDir:string)void} callback
 * @param {number} timeout
 */
function lockCreateDir(dirPath, callback, timeout) {

    lockFile(dirPath, function createDir(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            fs.mkdir(dirPath, { recursive: true, mode: 0o770 }, function (err, pathDir) {

                fnUnlock(); callback(err, pathDir);
            });
        }

    }, timeout);
}
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockDeleteDir(dirPath, callback, timeout) {

    lockFile(dirPath, function deleteDir(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        else {

            fs.rm(dirPath, { recursive: true }, function (err) {

                fnUnlock(); callback(err);
            });
        }

    }, timeout);
}
/**
 * @param {string} path
 * @param {(err:any)void} callback
 * @param {number} timeout
 */
function lockAccess(path, callback, timeout) {

    lockFile(path, function access(err, fnUnlock) {

        if (err) { fnUnlock(); callback(err); }

        fs.access(path, fs.constants.F_OK, function (err) {

            fnUnlock(); callback(err);
        })

    }, timeout);
}


//#endregion

/** Exports functions directly, without 'net_fn' */
exports.directly = {
    lockReadFile,
    lockWriteFile,
    lockReadWriteFile,
    lockAppendFile,
    lockDeleteFile,
    lockRename,
    lockCreateDir,
    lockDeleteDir,
    lockAccess
};

//#region net_fn

var net_fn = require("net-fn");

var fns = [
    lockReadFile,
    lockWriteFile,
    lockReadWriteFile,
    lockAppendFile,
    lockDeleteFile,
    lockRename,
    lockCreateDir,
    lockDeleteDir,
    lockAccess
];

var fn_exports = net_fn.connect(fns, options.ipc_port, options.ipc_host);
Object.keys(fn_exports).forEach(function (key) { exports[key] = fn_exports[key]; });


if (isDebug) { console.log("`[ DEBUG ] 'file-lockdown' Starting worker!"); }
net_fn.tryToRunServer(__filename, options.ipc_port, function (worker) {

    if (worker) {

        exports.worker = worker;
    }
    else {

        if (isDebug) { console.log("`[ DEBUG ] 'file-lockdown' Starting server!"); }
        net_fn.createServer(fns, options.ipc_port, function (server) {

            exports.server = server;

        }, options.ipc_host);
    }


}, options.ipc_host);


//#endregion