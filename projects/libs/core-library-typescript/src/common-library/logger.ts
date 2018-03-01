// Adds source map support to node.js stack traces.
import "source-map-support/register";

import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";
import { defaults } from "lodash";

const { NODE_NAME, NODE_IP, NODE_ENV, SERVICE_NAME } = process.env;

export interface LogzIoOptions {
  apiKey: string;
}

export interface FileOptions {
  fileName: string;
  json?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

export interface LoggerOptions {
  level?: string;
  file?: FileOptions;
  console?: boolean;
  logzio?: LogzIoOptions;
}

export class Logger {
  public static readonly LOG_TYPES = ["debug", "info", "warn", "error"];
  public static readonly DEFAULT_LOG_LEVEL = "info";
  private static readonly LOGZIO_HOST = "listener.logz.io";

  public static readonly DEFAULT_OPTIONS: LoggerOptions = {
    level: Logger.DEFAULT_LOG_LEVEL,
    console: Logger.isTest(),
    logzio: {
      apiKey: undefined
    }
  };

  public static readonly DEFAULT_FILE_OPTIONS: FileOptions = {
    fileName: undefined,
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20,
    json: !Logger.isTest()
  };

  private logger: winston.LoggerInstance;

  public constructor() {
    this.configure();
  }

  public configure(options?: LoggerOptions) {
    const loggerOptions = defaults(options, Logger.DEFAULT_OPTIONS);

    if (Logger.LOG_TYPES.indexOf(loggerOptions.level) == -1) {
      loggerOptions.level = Logger.DEFAULT_LOG_LEVEL;
    }

    this.logger = new winston.Logger({
      level: loggerOptions.level,
      rewriters: [
        (level, msg, meta) => {
          meta.node = NODE_NAME;
          meta.node_ip = NODE_IP;
          meta.environment = NODE_ENV;
          meta.service = SERVICE_NAME;

          return meta;
        }
      ]
    });

    // Enable file output.
    if (loggerOptions.file && loggerOptions.file.fileName) {
      this.enableFileTransport(loggerOptions.file);
    }

    // Enable console output.
    if (loggerOptions.console) {
      this.enableConsole();
    }

    // Enable log shipping to Logz.io (according to the configuration).
    if (loggerOptions.logzio && loggerOptions.logzio.apiKey) {
      this.enableLogzio(loggerOptions.level, loggerOptions.logzio.apiKey);
    }
  }

  public readonly debug: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this.logMessage(this.logger.debug, msg, ...meta);
  }

  public readonly info: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this.logMessage(this.logger.info, msg, ...meta);
  }

  public readonly warn: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this.logMessage(this.logger.warn, msg, ...meta);
  }

  public readonly error: winston.LeveledLogMethod = (msg: string | Error, ...meta: any[]): winston.LoggerInstance => {
    return this.logError(this.logger.error, msg, ...meta);
  }

  public readonly fatal: winston.LeveledLogMethod = (msg: string | Error, ...meta: any[]): winston.LoggerInstance => {
    return this.logError(this.logger.emerg, msg, ...meta);
  }

  private logMessage(method: winston.LeveledLogMethod, msg: string, ...meta: any[]): winston.LoggerInstance {
    method(<string>msg, ...meta);

    return this.logger;
  }

  private logError(method: winston.LeveledLogMethod, msg: string | Error, ...meta: any[]): winston.LoggerInstance {
    method(<string>msg, ...meta);

    if (msg instanceof Error) {
      method(msg.stack, ...meta);
    }

    return this.logger;
  }

  private static mkdir(fileName: string): void {
    // Create the directory, if it does not exist.
    const logsDir = path.dirname(fileName);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
  }

  private enableFileTransport(options: FileOptions): void {
    const fileOptions = defaults(options, Logger.DEFAULT_FILE_OPTIONS);

    fileOptions.fileName = path.resolve(fileOptions.fileName);

    // Create the directory, if it does not exist.
    Logger.mkdir(fileOptions.fileName);

    this.logger.add(winston.transports.File, {
      filename: fileOptions.fileName,
      maxsize: fileOptions.maxSize,
      maxFiles: fileOptions.maxFiles,
      json: fileOptions.json,
      prettyPrint: false,
      tailable: true,
    });
  }

  private enableConsole(): void {
    this.logger.add(winston.transports.Console, {
      json: false,
      colorize: true,
      timestamp: true
    });
  }

  private enableLogzio(level: string, apiKey: string): void {
    const winstonLogzioTransport = require("winston-logzio");

    this.logger.add(winstonLogzioTransport, {
      level: level,
      token: apiKey,
      host: Logger.LOGZIO_HOST
    });
  }

  private static isTest(): boolean {
    return process.env.NODE_ENV === "test";
  }
}

export const logger = new Logger();
