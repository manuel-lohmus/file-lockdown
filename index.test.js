"use strict";

var test = require('node:test');
var path = require('node:path');
var file_lockdown = require("./index.js");

function subtest(t, done, ...arg) {

    function wait(t, callback) {

        callback.tests = t.tests;

        if (t.tests === callback.tests) {

            return callback();
        }

        setTimeout(function () { wait(t, callback); }, 10);
    }

    if (!t.tests) { t.tests = 0; }
    t.tests++;

    wait(t, function () {

        t.test(arg[0], arg[1], arg[3]).finally(function () {

            t.tests--;

            if (t.tests === 0) {

                done();
                delete t.tests;
            }
        })
    });
}
function testChecker(t, done) {

    if (!t.tests) {

        done();
        delete t.tests;
    }
}


var fl = file_lockdown.directly;
test('file-lockdown', function (t, done) {

    var dirname = 'test_dir';
    var filename = 'test_file.txt';
    filename = path.join(dirname, filename);


    function createDir() {
        subtest(t, done, 'lockCreateDir', function (t, done) {

            fl.lockCreateDir(dirname, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function writeFile(str) {
        subtest(t, done, 'lockWriteFile', function (t, done) {

            fl.lockWriteFile(filename, str, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function access() {
        subtest(t, done, 'lockAccess', function (t, done) {

            fl.lockAccess(filename, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function readWriteFile(strReaded, strWrite) {
        subtest(t, done, 'lockReadWriteFile', function (t, done) {

            fl.lockReadWriteFile(filename, function (err, str, fnWriteClose) {
                if (err) { done(err); }
                else if (str === strReaded) {
                    fnWriteClose(strWrite, true, function (err) {
                        done(err);
                    });
                }
                else {
                    fnWriteClose();
                    done('wrong content');
                }
            });
        });
    }
    function readFile(strReaded) {
        subtest(t, done, 'lockReadFile', function (t, done) {

            fl.lockReadFile(filename, function (err, str) {
                if (err) { done(err); }
                else if (str === strReaded) { done(); }
                else { done('wrong content'); }
            });
        });
    }
    function appendFile(str) {
        subtest(t, done, 'lockAppendFile', function (t, done) {

            fl.lockAppendFile(filename, str, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function rename() {
        subtest(t, done, 'lockRename', function (t, done) {

            var new_filename = filename + '.bak'
            fl.lockRename(filename, new_filename, function (err) {
                if (err) { done(err); }
                else {
                    fl.lockRename(new_filename, filename, function (err) {
                        if (err) { done(err); }
                        else { done(); }
                    });
                }
            });
        });
    }
    function deleteFile() {
        subtest(t, done, 'lockDeleteFile', function (t, done) {

            fl.lockDeleteFile(filename, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function deleteDir() {
        subtest(t, done, 'lockDeleteDir', function (t, done) {

            fl.lockDeleteDir(dirname, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }

    function test() {

        createDir();
        writeFile('test');
        access();
        readWriteFile('test', 'tested');
        readFile('tested');
        appendFile('test');
        readFile('testedtest');
        rename();
        deleteFile();
        deleteDir();

        testChecker(t, done);
    }

    test();
});

fl = file_lockdown;
test('file-lockdown-net', function (t, done) {

    var dirname = 'test_dir';
    var filename = 'test_file.txt';
    filename = path.join(dirname, filename);


    function createDir() {
        subtest(t, done, 'lockCreateDir', function (t, done) {

            fl.lockCreateDir(dirname, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function writeFile(str) {
        subtest(t, done, 'lockWriteFile', function (t, done) {

            fl.lockWriteFile(filename, str, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function access() {
        subtest(t, done, 'lockAccess', function (t, done) {

            fl.lockAccess(filename, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function readWriteFile(strReaded, strWrite) {
        subtest(t, done, 'lockReadWriteFile', function (t, done) {

            fl.lockReadWriteFile(filename, function (err, str, fnWriteClose) {
                if (err) { done(err); }
                else if (str === strReaded) {
                    fnWriteClose(strWrite, true, function (err) {
                        done(err);
                    });
                }
                else {
                    fnWriteClose();
                    done('wrong content');
                }
            });
        });
    }
    function readFile(strReaded) {
        subtest(t, done, 'lockReadFile', function (t, done) {

            fl.lockReadFile(filename, function (err, str) {
                if (err) { done(err); }
                else if (str === strReaded) { done(); }
                else { done('wrong content'); }
            });
        });
    }
    function appendFile(str) {
        subtest(t, done, 'lockAppendFile', function (t, done) {

            fl.lockAppendFile(filename, str, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function rename() {
        subtest(t, done, 'lockRename', function (t, done) {

            var new_filename = filename + '.bak'
            fl.lockRename(filename, new_filename, function (err) {
                if (err) { done(err); }
                else {
                    fl.lockRename(new_filename, filename, function (err) {
                        if (err) { done(err); }
                        else { done(); }
                    });
                }
            });
        });
    }
    function deleteFile() {
        subtest(t, done, 'lockDeleteFile', function (t, done) {

            fl.lockDeleteFile(filename, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }
    function deleteDir() {
        subtest(t, done, 'lockDeleteDir', function (t, done) {

            fl.lockDeleteDir(dirname, function (err) {
                if (err) { done(err); }
                else { done(); }
            });
        });
    }

    function test() {

        createDir();
        writeFile('test');
        access();
        readWriteFile('test', 'tested');
        readFile('tested');
        appendFile('test');
        readFile('testedtest');
        rename();
        deleteFile();
        deleteDir();

        testChecker(t, done);
    }

    test();
});
