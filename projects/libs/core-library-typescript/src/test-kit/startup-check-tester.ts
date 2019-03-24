/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { StartupStatus, STARTUP_STATUS } from "../common-library/startup-status";
import * as _ from "lodash";
import * as request from "supertest";

export function testStartupCheckHappyPath(serverIpAddress: string, port: number, componentName: string, childServiceNames?: string[], ) {
  const expected: StartupStatus = {
    name: componentName,
    status: STARTUP_STATUS.OK,
  };
  if (childServiceNames && childServiceNames.length > 0) {
    expected.services = _.map(childServiceNames, name => { return { name, status: STARTUP_STATUS.OK }; });
  }

  return request(`http://${serverIpAddress}:${port}`)
    .get("/admin/startupCheck")
    .expect(200, expected);
}

