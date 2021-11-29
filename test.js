"use strict";

var file_lock = require("./index.min.js");
setTimeout(function () {
    file_lock.lockAppendFile("./test.txt", "1 test\r\n", function (err) {
        if (err) { console.error(err); }
    });
}, 100);