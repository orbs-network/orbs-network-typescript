// Adds source map support to node.js stack traces.
import "source-map-support/register";

import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";
import { defaults } from "lodash";

import { config } from "./config";

const winstonLogzioTransport = require("winston-logzio");

export class Logger {
  public static readonly DEFAULT_OPTIONS = {
    level: "info",
    fileName: "logs/default.log",
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20,
    console: false,
    logzio: {
      enabled: false,
      apiKey: undefined
    }
  };

  public static readonly LOG_TYPES = ["debug", "info", "warn", "error"];

  private static readonly CONFIG_LOG = "logger";
  private static readonly LOGZIO_HOST = "listener.logz.io";

  private _logger: winston.LoggerInstance;

  constructor(options = {}) {
    const opts = defaults(options, Logger.DEFAULT_OPTIONS);

    if (Logger.LOG_TYPES.indexOf(opts.level) !== -1) {
      opts.level = Logger.DEFAULT_LOG_LEVEL;
    }

    // Create the directory, if it does not exist.
    Logger.mkdir(opts.fileName);

    this._logger = new winston.Logger({
      level: opts.level,
      transports: [
        new winston.transports.File({
          filename: path.resolve(Logger.resolvePath(opts.fileName)),
          maxsize: opts.maxSize,
          maxFiles: opts.maxFiles,
          prettyPrint: true,
          tailable: true,
          json: false
        })
      ]
    });

    // Enable console output, during development.
    if (opts.console) {
      this.enableConsole();
    }

    // Enable log shipping to Logz.io (according to the configuration).
    if (opts.logzio && opts.logzio.enabled) {
      this.enableLogzio(opts.logzio.apiKey);
    }
  }

  public static fromConfiguration(): Logger {
    const loggerConfig = config.get(Logger.CONFIG_LOG);
    loggerConfig.console = config.isDevelopment() || config.isTest();

    return new Logger(loggerConfig);
  }

  public readonly debug: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this._logger.debug(msg, ...meta);
  }

  public readonly info: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this._logger.info(msg, ...meta);
  }

  public readonly warn: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this._logger.warn(msg, ...meta);
  }

  public readonly error: winston.LeveledLogMethod = (msg: string | Error, ...meta: any[]): winston.LoggerInstance => {
    return this.logError(this._logger.error, msg, ...meta);
  }

  public readonly fatal: winston.LeveledLogMethod = (msg: string | Error, ...meta: any[]): winston.LoggerInstance => {
    return this.logError(this._logger.emerg, msg, ...meta);
  }

  private logError(method: winston.LeveledLogMethod, msg: string | Error, ...meta: any[]): winston.LoggerInstance {
    method(<string>msg, ...meta);

    if (msg instanceof Error) {
      method(msg.stack, ...meta);
    }

    return this._logger;
  }

  private static mkdir(fileName: string): void {
    // Create the directory, if it does not exist.
    const logsDir = Logger.resolvePath(path.dirname(fileName));
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
  }

  private static resolvePath(pathname: string): string {
    return path.resolve(path.join("../../", pathname));
  }

  private enableConsole(): void {
    this._logger.add(winston.transports.Console, {
      json: false,
      colorize: true,
      timestamp: true
    });
  }

  private enableLogzio(apiKey: string): void {
    this._logger.add(winstonLogzioTransport, {
      token: apiKey,
      host: Logger.LOGZIO_HOST
    });
  }
}

export const logger = Logger.fromConfiguration();
