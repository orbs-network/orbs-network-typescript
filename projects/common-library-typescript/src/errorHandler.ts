import * as uncaughtHandler from "uncaught-exception";
import * as os from "os";
import { logger } from "./logger";

export type Callback = (callback?: any) => void;

export class ErrorHandler {
  public static setup(abortOnUncaught: boolean = false, gracefulShutdown?: Callback) {
    const onError = uncaughtHandler({
      logger: {
        fatal: (message: string, meta: any, callback: Callback) => {
          logger.error(message, meta.error);
          logger.error(meta.error.stack);

          callback();
        },
      },
      statsd: {
        // TODO: add stats support.
        immediateIncrement: (key: string, count: number, callback: Callback) => {
          callback();
        },
      },
      meta: {
        hostname: os.hostname()
      },
      abortOnUncaught: abortOnUncaught,
      gracefulShutdown: (callback: Callback) => {
        gracefulShutdown ? gracefulShutdown(callback) : callback();
      }
    });

    process.on("uncaughtException", onError);

    process.on("unhandledRejection", (err: Error) => {
      logger.error(`Unhandled rejection: ${err}\n${err.stack}`);
    });
  }
}
