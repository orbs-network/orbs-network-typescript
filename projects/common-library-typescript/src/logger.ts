import config from "./config";
import * as winston from "winston";
import * as path from "path";

export class Logger {
  public static readonly LOG_TYPES = ["debug", "info", "warn", "error"];
  public static readonly DEFAULT_LOG_LEVEL = "info";
  public static readonly DEFAULT_FILE_NAME = "logs/default.log";
  public static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1000;
  public static readonly DEFAULT_MAX_FILES = 20;
  private static readonly CONFIG_LOG_LEVEL = "logger:level";
  private static readonly CONFIG_FILE_NAME = "logger:fileName";
  private static readonly CONFIG_MAX_SIZE = "logger:maxSize";
  private static readonly CONFIG_MAX_FILES = "logger:maxFiles";

  private _logger: winston.LoggerInstance;

  constructor() {
    this._logger = new winston.Logger({
      level: this.getLogLevel(),
      transports: [
        new winston.transports.File({
          filename: path.resolve(path.join("../../", this.getFileName())),
          maxsize: this.getMaxSize(),
          maxFiles: this.getMaxFiles(),
          prettyPrint: true,
          tailable: true
        })
      ]
    });

    if (config.isDevelopment()) {
      this.enableConsole();
    }
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
}

export const logger = new Logger();
