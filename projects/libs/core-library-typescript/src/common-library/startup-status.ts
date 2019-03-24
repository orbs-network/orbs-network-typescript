/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export interface StartupStatus {
  name: string;
  status: STARTUP_STATUS;
  services?: StartupStatus[];
  message?: string;
}

export enum STARTUP_STATUS { OK = "OK", FAIL = "FAIL", PARTIALLY_OPERATIONAL = "PARTIALLY_OPERATIONAL" }
