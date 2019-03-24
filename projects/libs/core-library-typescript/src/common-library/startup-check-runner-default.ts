/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
