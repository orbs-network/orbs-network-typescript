import { StartupCheckRunner } from "./startup-check-runner";
import { StartupCheck } from "./startup-check";
import { StartupStatus, STARTUP_STATUS } from "./startup-status";
import { logger } from "../common-library";

export class StartupCheckRunnerDefault extends StartupCheckRunner {

  constructor(name: string, startupChecks?: StartupCheck[]) {
    super(name, startupChecks);
  }

  run(): Promise<StartupStatus> {
    return Promise.resolve(<StartupStatus>{ name: this.name, status: STARTUP_STATUS.OK, message: "Not implemented" });
  }
}
