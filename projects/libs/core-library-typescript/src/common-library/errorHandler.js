"use strict";
exports.__esModule = true;
var uncaughtHandler = require("uncaught-exception");
var os = require("os");
var logger_1 = require("./logger");
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
    }
    ErrorHandler.setup = function (abortOnUncaught, gracefulShutdown) {
        if (abortOnUncaught === void 0) { abortOnUncaught = false; }
        var onError = uncaughtHandler({
            logger: {
                fatal: function (message, meta, callback) {
                    logger_1.logger.error(message, meta.error);
                    logger_1.logger.error(meta.error.stack);
                    callback();
                }
            },
            statsd: {
                // TODO: add stats support.
                immediateIncrement: function (key, count, callback) {
                    callback();
                }
            },
            meta: {
                hostname: os.hostname()
            },
            abortOnUncaught: abortOnUncaught,
            gracefulShutdown: function (callback) {
                gracefulShutdown ? gracefulShutdown(callback) : callback();
            }
        });
        process.on("uncaughtException", onError);
        process.on("unhandledRejection", function (err) {
            logger_1.logger.error("Unhandled rejection: " + err + "\n" + err.stack);
        });
    };
    return ErrorHandler;
}());
exports.ErrorHandler = ErrorHandler;
