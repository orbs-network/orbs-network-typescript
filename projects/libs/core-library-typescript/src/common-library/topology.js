"use strict";
exports.__esModule = true;
var logger_1 = require("./logger");
var fs = require("fs");
function showUsage() {
    logger_1.logger.warn("Usage: node dist/index.js <topology-path>");
}
if (!process.argv[2]) {
    logger_1.logger.error("topology not provided, exiting");
    showUsage();
    process.exit();
}
var filePath = process.argv[2];
if (!fs.existsSync(filePath)) {
    logger_1.logger.error("topology with path '" + filePath + "' not found, exiting");
    showUsage();
    process.exit();
}
exports.topology = require(filePath);
