/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { StartupCheck } from "./startup-check";
import { StartupStatus, STARTUP_STATUS } from "./startup-status";
import { logger } from "../common-library";
import * as _ from "lodash";

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
        if (mergedStartupStatus.status !== STARTUP_STATUS.OK) {
          logger.info("Health check", _.cloneDeep(mergedStartupStatus)); // mergedStartupStatus is mutated inside logger.info, so cloned
        }
        return mergedStartupStatus;
      })
      .catch(err => {
        logger.error(`Error on startup check,`, err);
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
