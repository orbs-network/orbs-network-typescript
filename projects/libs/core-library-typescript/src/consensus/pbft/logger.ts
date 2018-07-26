import { logger } from "../../common-library/logger";
import { Logger, LogTypes } from "pbft-typescript";


export class PBFTLogger implements Logger {
  public log(data: LogTypes): void {
    const dataStr = JSON.stringify(data, undefined, 2);
    logger.debug(dataStr);
  }
}

