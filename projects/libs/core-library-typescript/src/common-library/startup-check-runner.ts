import { StartupCheck } from "./startup-check";
import { StartupStatus, STARTUP_STATUS } from "./startup-status";
import { logger } from "../common-library";

export class StartupCheckRunner {
  public readonly name: string;
  public readonly startupCheckers: StartupCheck[] = [];

  constructor(name: string, startupCheckers: StartupCheck[]) {
    this.name = name;
    this.startupCheckers = startupCheckers;
  }

  run(): Promise<StartupStatus> {

    const startupCheckPromises = this.startupCheckers.map((s: StartupCheck) => s.startupCheck());
    return Promise.all(startupCheckPromises)
      .then(statuses => {
        const mergedStartupStatus = this.mergeStartupStatuses(this.name, statuses);
        logger.info(`StartupCheckRunner.run() result: ${JSON.stringify(mergedStartupStatus)}`);
        return mergedStartupStatus;
      })
      .catch(err => {
        logger.error(err);
        return <StartupStatus>{ status: STARTUP_STATUS.FAIL, message: err.message };
      });
  }

  mergeStartupStatuses(name: string, startupStatuses: StartupStatus[]): StartupStatus {

    let hasAtLeastOneOk = false;
    let hasAtLeastOneFailure = false;

    for (const item of startupStatuses) {
      if (item.status === STARTUP_STATUS.OK) {
        hasAtLeastOneOk = true;
      } else {
        hasAtLeastOneFailure = true;
      }
    }

    if (!hasAtLeastOneFailure) {
      return { name, status: STARTUP_STATUS.OK, services: startupStatuses };
    }
    if (hasAtLeastOneOk) {
      return { name, status: STARTUP_STATUS.PARTIALLY_OPERATIONAL, services: startupStatuses };
    }
    return { name, status: STARTUP_STATUS.FAIL, services: startupStatuses };
  }

}
