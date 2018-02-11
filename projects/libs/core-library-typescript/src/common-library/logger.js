"use strict";
exports.__esModule = true;
// Adds source map support to node.js stack traces.
require("source-map-support/register");
var winston = require("winston");
var path = require("path");
var fs = require("fs");
var lodash_1 = require("lodash");
var config_1 = require("./config");
var _a = process.env, NODE_NAME = _a.NODE_NAME, NODE_IP = _a.NODE_IP, NODE_ENV = _a.NODE_ENV, SERVICE_NAME = _a.SERVICE_NAME;
var Logger = /** @class */ (function () {
    function Logger(options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.debug = function (msg) {
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            return (_a = _this._logger).debug.apply(_a, [msg].concat(meta));
            var _a;
        };
        this.info = function (msg) {
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            return (_a = _this._logger).info.apply(_a, [msg].concat(meta));
            var _a;
        };
        this.warn = function (msg) {
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            return (_a = _this._logger).warn.apply(_a, [msg].concat(meta));
            var _a;
        };
        this.error = function (msg) {
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            return _this.logError.apply(_this, [_this._logger.error, msg].concat(meta));
        };
        this.fatal = function (msg) {
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            return _this.logError.apply(_this, [_this._logger.emerg, msg].concat(meta));
        };
        var opts = lodash_1.defaults(options, Logger.DEFAULT_OPTIONS);
        if (Logger.LOG_TYPES.indexOf(opts.level) == -1) {
            opts.level = Logger.DEFAULT_LOG_LEVEL;
        }
        // Create the directory, if it does not exist.
        Logger.mkdir(opts.fileName);
        this._logger = new winston.Logger({
            level: opts.level,
            transports: [
                new winston.transports.File({
                    filename: Logger.resolvePath(opts.fileName),
                    maxsize: opts.maxSize,
                    maxFiles: opts.maxFiles,
                    prettyPrint: false,
                    tailable: true,
                    json: true
                })
            ],
            rewriters: [
                function (level, msg, meta) {
                    meta.node = NODE_NAME;
                    meta.node_ip = NODE_IP;
                    meta.environment = NODE_ENV;
                    meta.service = SERVICE_NAME;
                    return meta;
                }
            ]
        });
        // Enable console output, during development.
        if (opts.console) {
            this.enableConsole();
        }
        // Enable log shipping to Logz.io (according to the configuration).
        if (opts.logzio && opts.logzio.enabled) {
            this.enableLogzio(opts.logzio.apiKey, opts.level);
        }
    }
    Logger.fromConfiguration = function () {
        var loggerConfig = config_1.config.get(Logger.CONFIG_LOG);
        return new Logger(loggerConfig);
    };
    Logger.prototype.logError = function (method, msg) {
        var meta = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            meta[_i - 2] = arguments[_i];
        }
        method.apply(void 0, [msg].concat(meta));
        if (msg instanceof Error) {
            method.apply(void 0, [msg.stack].concat(meta));
        }
        return this._logger;
    };
    Logger.mkdir = function (fileName) {
        // Create the directory, if it does not exist.
        var logsDir = Logger.resolvePath(path.dirname(fileName));
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }
    };
    Logger.resolvePath = function (pathname) {
        return path.resolve(path.join("../../../", pathname));
    };
    Logger.prototype.enableConsole = function () {
        this._logger.add(winston.transports.Console, {
            json: false,
            colorize: true,
            timestamp: true
        });
    };
    Logger.prototype.enableLogzio = function (apiKey, level) {
        var winstonLogzioTransport = require("winston-logzio");
        this._logger.add(winstonLogzioTransport, {
            level: level,
            token: apiKey,
            host: Logger.LOGZIO_HOST
        });
    };
    Logger.DEFAULT_OPTIONS = {
        level: "info",
        fileName: "logs/default.log",
        maxSize: 10 * 1024 * 1024,
        maxFiles: 20,
        console: false,
        logzio: {
            enabled: false,
            apiKey: ""
        }
    };
    Logger.LOG_TYPES = ["debug", "info", "warn", "error"];
    Logger.DEFAULT_LOG_LEVEL = "info";
    Logger.CONFIG_LOG = "logger";
    Logger.LOGZIO_HOST = "listener.logz.io";
    return Logger;
}());
exports.Logger = Logger;
exports.logger = Logger.fromConfiguration();
