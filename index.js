/**File locking functions. @preserve Copyright (c) 2021 Manuel Lõhmus.*/
"use strict";

var confSet = require("config-sets");
var options = confSet.init({
    file_lockdown: {
        enableSyncWrites: false,
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
 */
function lockFile(filePath, callback) {

    if (typeof callback !== "function") return;

    if (lockFiles[filePath]) {

        lockFiles[filePath].push(callback);
    }
    else {

        lockFiles[filePath] = [];
        lockFiles[filePath].progress = 0;
        lockFiles[filePath].push(callback);

        setImmediate(next);
        
        function fnUnlock() {

            if (lockFiles[filePath]) {
                lockFiles[filePath].progress--;
            }
        }
        function next() {

            if (!lockFiles[filePath]) { return; }
            if ((lockFiles[filePath].progress > 25)) {
                return setImmediate(next);
            }

            var cb = lockFiles[filePath].shift();

            if (cb) {
                lockFiles[filePath].progress++;
                cb(null, fnUnlock);
                next();
            }
            else { delete lockFiles[filePath]; }
        }
    }
}
/**
 * @param {string} filePath
 * @param {(err:any,data:Buffer)void} callback function(err,data)
 * @param {string} encoding Default: "utf8"
 */
function lockReadFile(filePath, callback, encoding = "utf8") {

    lockFile(filePath, function readFile(err, fnUnlock) {

        if (err) { callback(err); }

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

                            buffers.push(buffer.slice(0, bytesRead));

                            if (buffer[buffer.byteLength - 1] !== 0) {

                                position += bytesRead;
                                fs.read(fd, { position: position }, cb);
                            }
                            else {

                                close();
                                callback(null, Buffer.concat(buffers).toString(encoding));

                            }
                        }
                    }

                    var buffers = [], position = 0;
                    fs.read(fd, { position: position }, cb);
                }
            });
        }

    });
}
/**
 * @param {string} filePath
 * @param {Buffer} bufferdata
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 */
function lockWriteFile(filePath, buffer, callback, encoding = "utf8") {

    if (buffer !== undefined && buffer !== null) {

        lockFile(filePath, function writeFile(err, fnUnlock) {

            if (err) { callback(err); }

            else {

                fs.open(filePath, "w+", function (err, fd) {

                    function close() {
                        if (typeof fd === "number") { fs.close(fd, function () { fnUnlock(); }); }
                        else { fnUnlock(); }
                    }
                    function write(err) {

                        if (err) { close(); callback(err); }

                        else {

                            if (options.enableSyncWrites) {

                                fs.writeSync(fd, buffer, 0, encoding);
                                close();
                                callback();
                            }

                            else {

                                fs.write(fd, buffer, 0, encoding, function (err) {
                                
                                    close();
                                    callback(err);
                                });
                            }
                        }
                    }

                    if (err) { close(); callback(err); }

                    else { fs.ftruncate(fd, 0, write); }
                });
            }
        });
    }
    else { callback(new Error("fnWriteFile error: typeof buffer > " + typeof buffer)); }
}
/**
 * @param {string} filePath
 * @param {(err:any,buf:Buffer,fnWriteClose:(buf:Buffer,isTruncated:boolean, callback:(err:any)void)void)void} fnRead function(err,data,fnWriteClose(buffer))'buffer'dataforwritingandclose|nullforclose
 * @param {string} encoding Default: "utf8"
 */
function lockReadWriteFile(filePath, callback, encoding = "utf8") {

    lockFile(filePath, function readWriteFile(err, fnUnlock) {

        if (err) { callback(err); }

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
                function fnWriteClose(buffer, isTruncated, writeCallback) {

                    // Write file
                    fnOpen(filePath, flag, function (err, fd, fnClose) {

                        if (typeof writeCallback !== "function") { writeCallback = function () { }; }

                        if (err) {
                            fnUnlock();
                            writeCallback(err);
                        }
                        else {

                            function fnWrite(err) {

                                if (err) {
                                    fnClose();
                                    fnUnlock();
                                    writeCallback(err);
                                }
                                else if (buffer) {

                                    if (options.enableSyncWrites) {

                                        fs.writeSync(fd, buffer, 0, encoding);
                                        fnClose();
                                        fnUnlock();
                                        writeCallback(err);
                                    }

                                    else {

                                        fs.write(fd, buffer, 0, encoding, function (err) {

                                            fnClose();
                                            fnUnlock();
                                            writeCallback(err);
                                        });
                                    }
                                }
                                else {
                                    fnClose();
                                    fnUnlock();
                                    writeCallback(new Error("fnWrite error: typeof buffer > " + typeof buffer ));
                                }
                            }

                            if (buffer === null) {
                                fnClose();
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

                                buffers.push(buffer.slice(0, bytesRead));

                                if (buffer[buffer.byteLength - 1] !== 0) {

                                    position += bytesRead;
                                    fs.read(fd, { position: position }, cb);
                                }
                                else {
                                    fnClose();
                                    callback(
                                        null,
                                        Buffer.concat(buffers).toString(encoding),
                                        fnWriteClose
                                    );

                                }
                            }
                        }

                        var buffers = [], position = 0;
                        fs.read(fd, { position: position }, cb);
                    }
                });
            });
        }

    });
}
/**
 * @param {string} filePath
 * @param {Buffer} buffer
 * @param {(err:any)void} callback function(err)
 * @param {string} encoding Default: "utf8"
 */
function lockAppendFile(filePath, buffer, callback, encoding = "utf8") {

    if (buffer !== undefined && buffer !== null) {
        
        lockFile(filePath, function appendFile(err, fnUnlock) {

            if (err) { callback(err); }

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

        });
    }
    else { callback(new Error('Wrong buffer value.')); }
}
/**
 * @param {string} filePath
 * @param {(err:any)void} callback function(err)
 */
function lockDeleteFile(filePath, callback) {

    lockFile(filePath, function deleteFile(err, fnUnlock) {

        if (err) { callback(err); }

        else {

            //fs.unlink(filePath, function (err) {

            //    fnUnlock(); callback(err);
            //});

            fs.rm(filePath, function (err) {

                fnUnlock(); callback(err);
            });
        }
    });
}
/**
 * @param {string} filePath
 * @param {string} newPath
 * @param {(err:any)void} callback
 */
function lockRename(filePath, newPath, callback) {

    lockFile(filePath, function rename(err, fnUnlock) {

        if (err) { callback(err); }

        else {

            fs.rename(filePath, newPath, function (err) {

                fnUnlock(); callback(err);
            });
        }
    });
}
/**
 * @param {string} dirPath
 * @param {(err:any, pathDir:string)void} callback
 */
function lockCreateDir(dirPath, callback) {

    lockFile(dirPath, function createDir(err, fnUnlock) {

        if (err) { callback(err); }

        else {

            fs.mkdir(dirPath, { recursive: true, mode: 0o770 }, function (err, pathDir) {

                fnUnlock(); callback(err, pathDir);
            });
        }

    });
}
/**
 * @param {string} dirPath
 * @param {(err:any)void} callback
 */
function lockDeleteDir(dirPath, callback) {

    lockFile(dirPath, function deleteDir(err, fnUnlock) {

        if (err) { callback(err); }

        else {

            fs.rm(dirPath, { recursive: true }, function (err) {

                fnUnlock(); callback(err);
            });
        }

    });
}
/**
 * @param {string} path
 * @param {(err:any)void} callback
 */
function lockAccess(path, callback) {

    lockFile(path, function access(err, fnUnlock) {

        if (err) { callback(err); }

        fs.access(path, fs.constants.F_OK, function (err) {

            fnUnlock(); callback(err);
        })

    });
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