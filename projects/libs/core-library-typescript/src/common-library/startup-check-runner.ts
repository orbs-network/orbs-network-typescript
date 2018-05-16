import { StartupCheck } from "./startup-check";
import { StartupStatus, STARTUP_STATUS } from "./startup-status";
import { logger } from "../common-library";

export class StartupCheckRunner {
  name: string;
  startupCheckers: StartupCheck[] = [];

  constructor(name: string, startupCheckers: StartupCheck[]) {
    this.name = name;
    this.startupCheckers = startupCheckers;
  }

  run(): Promise<StartupStatus> {

    logger.info(`There are ${this.startupCheckers.length} status checkers`);
    const startupCheckPromises = this.startupCheckers.map((s: StartupCheck) => s.startupCheck());
    return Promise.all(startupCheckPromises)
      .then(this.mergeStartupStatuses)
      .catch(err => {
        logger.error(err);
        return <StartupStatus>{ status: STARTUP_STATUS.FAIL, message: err.message };
      });
  }

  private mergeStartupStatuses = (startupStatuses: StartupStatus[]): StartupStatus => {

    let hasAtLeastOneOk = false;
    let hasAtLeastOneFailure = false;

    for (const item of startupStatuses) {
      logger.info(`MERGE: ${JSON.stringify(item)}`);
      if (item.status === STARTUP_STATUS.OK) {
        hasAtLeastOneOk = true;
      } else {
        hasAtLeastOneFailure = true;
      }
    }

    if (!hasAtLeastOneFailure) {
      return <StartupStatus>{ name: this.name, status: STARTUP_STATUS.OK, childStartupStatuses: startupStatuses };
    }
    if (hasAtLeastOneOk) {
      return <StartupStatus>{ name: this.name, status: STARTUP_STATUS.PARTIALLY_OPERATIONAL, childStartupStatuses: startupStatuses };
    }
    return <StartupStatus>{ name: this.name, status: STARTUP_STATUS.FAIL, childStartupStatuses: startupStatuses };

  };





}
