import { StartupCheck } from "./startup-check";
import { StartupCheckResult, STARTUP_CHECK_STATUS } from "./startup-check-result";

export class StartupCheckComposite {
  startupChecks: Set<StartupCheck> = new Set();

  constructor(newStartupChecks: StartupCheck[]) {

    for (const item of newStartupChecks) {
      this.startupChecks.add(item);
    }
  }

  addStartupCheck(startupCheck: StartupCheck) {
    this.startupChecks.add(startupCheck);
  }

  startupCheck(): Promise<StartupCheckResult> {

    const startupChecks = Array.from(this.startupChecks).map(s => s.startupCheck());
    return Promise.all(startupChecks)
      .then(startupCheckResults => {

        const combinedStartupCheckResult: StartupCheckResult = this.combineStartupChecks(startupCheckResults);

        return combinedStartupCheckResult;
      })
      .catch(err => {
        return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, message: err.message };
      });
  }

  private combineStartupChecks(startupCheckResults: StartupCheckResult[]): StartupCheckResult {

    const combinedServiceNames = startupCheckResults.map(s => s.serviceName).join(", ");

    for (const item of startupCheckResults) {
      if (item.status !== STARTUP_CHECK_STATUS.OK) {
        return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, serviceName: combinedServiceNames };
      }
    }
    return <StartupCheckResult>{ status: STARTUP_CHECK_STATUS.OK, serviceName: combinedServiceNames };

  }





}
