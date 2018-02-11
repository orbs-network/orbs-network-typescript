"use strict";
exports.__esModule = true;
var nconf = require("nconf");
var path = require("path");
var Config = /** @class */ (function () {
    function Config() {
        // Setup nconf to use (in-order):
        //   1. Command-line arguments.
        //   2. Environment variables.
        //   3. A file located at 'config/[ENVIRONMENT].json'
        nconf.argv().env({ separator: "__" }).file(path.resolve(__dirname, Config.RELATIVE_PATH, Config.getEnvironment()) + Config.EXT);
    }
    Config.prototype.get = function (key) {
        return nconf.get(key);
    };
    Config.prototype.isDevelopment = function () {
        return Config.getEnvironment() === Config.DEV_ENV;
    };
    Config.prototype.isStaging = function () {
        return Config.getEnvironment() === Config.STAGING_ENV;
    };
    Config.prototype.isTest = function () {
        return Config.getEnvironment() === Config.TEST_ENV;
    };
    Config.prototype.isProduction = function () {
        return Config.getEnvironment() === Config.PROD_ENV;
    };
    Config.getEnvironment = function () {
        return nconf.get(Config.NODE_ENV) || process.env[Config.NODE_ENV] || Config.DEV_ENV;
    };
    // This is just a convenience wrapper for getting the environment name directly from an instance of the configuration.
    Config.prototype.getEnvironment = function () {
        return Config.getEnvironment();
    };
    Config.NODE_ENV = "NODE_ENV";
    Config.TEST_ENV = "test";
    Config.DEV_ENV = "development";
    Config.PROD_ENV = "production";
    Config.STAGING_ENV = "staging";
    Config.RELATIVE_PATH = "../../../../config/";
    Config.EXT = ".json";
    return Config;
}());
exports.Config = Config;
exports.config = new Config();
