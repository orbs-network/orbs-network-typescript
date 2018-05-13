import { StartupChecker } from "./startup-check";
import { StartupCheckResult, ServiceStatus, STARTUP_CHECK_STATUS } from "./startup-check-result";
import { ServiceStatusChecker } from "./service-status-check";
import { logger } from "../common-library";

export class StartupCheckComposite {
  serviceStatusCheckers: ServiceStatusChecker[] = [];

  constructor(serviceStatusCheckers: ServiceStatusChecker[]) {
    this.serviceStatusCheckers = serviceStatusCheckers;
  }

  addServiceStatusChecker(serviceStatusChecker: ServiceStatusChecker) {
    this.serviceStatusCheckers.push(serviceStatusChecker);
  }

  startupCheck(): Promise<StartupCheckResult> {

    const serviceStatusPromises = this.serviceStatusCheckers.map((s: ServiceStatusChecker) => s.checkServiceStatus());
    return Promise.all(serviceStatusPromises)
      .then((serviceStatuses: ServiceStatus[]) => {

        const startupCheckResult: StartupCheckResult = this.createStartupCheckResultFromServiceStatuses(serviceStatuses);
        return startupCheckResult;
      })
      .catch(err => {
        return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, message: err.message };
      });
  }

  private createStartupCheckResultFromServiceStatuses(serviceStatuses: ServiceStatus[]): StartupCheckResult {

    let hasOk = false;
    let hasNotOk = false;

    for (const item of serviceStatuses) {
      if (item.status === STARTUP_CHECK_STATUS.OK) {
        hasOk = true;
      } else {
        hasNotOk = true;
      }

      logger.info(`Service ${item.name} status is ${item.status}`);
    }

    if (!hasNotOk) {
      logger.info('Return OK');
      return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.OK, services: serviceStatuses };
    }
    if (hasOk) {
      logger.info('Return PARTIAL');
      return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.PARTIALLY_OPERATIONAL, services: serviceStatuses };
    }
    logger.info('Return FAIL');
    return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, services: serviceStatuses };

  }





}
