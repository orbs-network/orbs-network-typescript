import { StartupChecker } from "./startup-check";
import { StartupCheckResult, ServiceStatus, STARTUP_CHECK_STATUS } from "./startup-check-result";
import { ServiceStatusChecker } from "./service-status-check";
import { logger } from "../common-library";

export class StartupCheckComposite implements StartupChecker {
  serviceStatusCheckers: ServiceStatusChecker[] = [];

  addServiceStatusChecker(serviceStatusChecker: ServiceStatusChecker) {
    this.serviceStatusCheckers.push(serviceStatusChecker);
  }

  startupCheck(): Promise<StartupCheckResult> {

    logger.info(`There are ${this.serviceStatusCheckers.length} status checkers`);
    const serviceStatusPromises = this.serviceStatusCheckers.map((s: ServiceStatusChecker) => s.checkServiceStatus());
    return Promise.all(serviceStatusPromises)
      .then((serviceStatuses: ServiceStatus[]) => {

        const startupCheckResult: StartupCheckResult = this.createStartupCheckResultFromServiceStatuses(serviceStatuses);

        // const mockResult: StartupCheckResult = {
        //   status: STARTUP_CHECK_STATUS.OK,
        //   services: [
        //     <ServiceStatus>{ name: "block", status: STARTUP_CHECK_STATUS.OK },
        //     <ServiceStatus>{ name: "state", status: STARTUP_CHECK_STATUS.OK },
        //     <ServiceStatus>{ name: "gossip", status: STARTUP_CHECK_STATUS.OK },
        //     <ServiceStatus>{ name: "transactionPool", status: STARTUP_CHECK_STATUS.OK },
        //   ]
        // };

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
      logger.info(`COMPOSITE: ${JSON.stringify(item)}`);
      if (item.status === STARTUP_CHECK_STATUS.OK) {
        hasOk = true;
      } else {
        hasNotOk = true;
      }
    }

    if (!hasNotOk) {
      return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.OK, services: serviceStatuses };
    }
    if (hasOk) {
      return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.PARTIALLY_OPERATIONAL, services: serviceStatuses };
    }
    return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, services: serviceStatuses };

  }





}
