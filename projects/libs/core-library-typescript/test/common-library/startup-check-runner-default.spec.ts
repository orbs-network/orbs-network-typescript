/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as chai from "chai";
import * as mocha from "mocha";
import { StartupCheck } from "../../src/common-library/startup-check";
import { StartupCheckRunnerDefault } from "../../src/common-library/startup-check-runner-default";
import { StartupStatus, STARTUP_STATUS } from "../../src/common-library/startup-status";

const { expect } = chai;

const ROOT_COMPONENT = "ROOT";

describe("StartupCheckRunnerDefault always returns ok", () => {
  it("should return ok with NOT IMPLEMENTED message", async () => {

    const startupCheckRunnerDefault = new StartupCheckRunnerDefault(ROOT_COMPONENT);
    const expected = {
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.OK,
      message: "Not implemented"
    };
    const actual = await startupCheckRunnerDefault.run();
    expect(actual).to.deep.equal(expected);
  });

});
