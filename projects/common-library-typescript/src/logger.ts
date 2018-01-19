import { config } from "./config";
import * as winston from "winston";
import * as winstonLogzioTransport from "winston-logzio";
import * as path from "path";
import * as fs from "fs";

export class Logger {
  public static readonly LOG_TYPES = ["debug", "info", "warn", "error"];
  public static readonly DEFAULT_LOG_LEVEL = "info";
  public static readonly DEFAULT_FILE_NAME = "logs/default.log";
  public static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
  public static readonly DEFAULT_MAX_FILES = 20;
  private static readonly CONFIG_LOG = "logger";
  private static readonly CONFIG_LOG_LEVEL = `${Logger.CONFIG_LOG}:level`;
  private static readonly CONFIG_FILE_NAME = `${Logger.CONFIG_LOG}:fileName`;
  private static readonly CONFIG_MAX_SIZE = `${Logger.CONFIG_LOG}:maxSize`;
  private static readonly CONFIG_MAX_FILES = `${Logger.CONFIG_LOG}:maxFiles`;
  private static readonly CONFIG_LOGZIO = `${Logger.CONFIG_LOG}:logzio`;
  private static readonly CONFIG_LOGZIO_ENABLED = `${Logger.CONFIG_LOGZIO}:enabled`;
  private static readonly CONFIG_LOGZIO_API_KEY = `${Logger.CONFIG_LOGZIO}:apiKey`;
  private static readonly LOGZIO_HOST = "listener.logz.io";

  private _logger: winston.LoggerInstance;

  constructor() {
    // Create the directory, if it does not exist.
    this.mkdir();

    this._logger = new winston.Logger({
      level: this.getLogLevel(),
      transports: [
        new winston.transports.File({
          filename: path.resolve(Logger.resolvePath(this.getFileName())),
          maxsize: this.getMaxSize(),
          maxFiles: this.getMaxFiles(),
          prettyPrint: true,
          tailable: true
        })
      ]
    });

    // Enable console output, during development.
    if (config.isDevelopment()) {
      this.enableConsole();
    }

    // Enable log shipping to Logz.io (according to the configuration).
    this.enableLogzio();
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

  public readonly error: winston.LeveledLogMethod = (msg: string, ...meta: any[]): winston.LoggerInstance => {
    return this._logger.error(msg, ...meta);
  }

  private mkdir(): void {
    // Create the directory, if it does not exist.
    const logsDir = Logger.resolvePath(path.dirname(this.getFileName()));
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
  }

  private static resolvePath(pathname: string): string {
    return path.resolve(path.join("../../", pathname));
  }

  private getLogLevel(): string {
    const level: string = config.get(Logger.CONFIG_LOG_LEVEL);
    if (!Logger.DEFAULT_LOG_LEVEL.includes(level)) {
      return Logger.DEFAULT_LOG_LEVEL;
    }
    return level;
  }

  private getFileName(): string {
    return config.get(Logger.CONFIG_FILE_NAME) || Logger.DEFAULT_FILE_NAME;
  }

  private getMaxSize(): number {
    return Number(config.get(Logger.CONFIG_MAX_SIZE)) || Logger.DEFAULT_MAX_SIZE;
  }

  private getMaxFiles(): number {
    return Number(config.get(Logger.CONFIG_MAX_FILES)) || Logger.DEFAULT_MAX_FILES;
  }

  private enableConsole(): void {
    this. _logger.add(winston.transports.Console, {
      json: false,
      colorize: true,
      timestamp: true
    });
  }

  private enableLogzio(): void {
    if (!config.get(Logger.CONFIG_LOGZIO_ENABLED)) {
      return;
    }

    const apiKey: string = config.get(Logger.CONFIG_LOGZIO_API_KEY);
    if (!apiKey) {
      throw new Error("Missing API key!");
    }

    this._logger.add(winston.transports.Logzio, {
      token: apiKey,
      host: Logger.LOGZIO_HOST,
    });
  }
}

export const logger = new Logger();
