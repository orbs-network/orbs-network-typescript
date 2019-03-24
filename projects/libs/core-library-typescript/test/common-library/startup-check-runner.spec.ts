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
import { StartupCheckRunner } from "../../src/common-library/startup-check-runner";
import { StartupStatus, STARTUP_STATUS } from "../../src/common-library/startup-status";

const { expect } = chai;

const ROOT_COMPONENT = "ROOT";

describe("StartupCheckRunner", () => {

  class CheckerOk1 implements StartupCheck {
    startupCheck(): Promise<StartupStatus> {
      return Promise.resolve({ status: STARTUP_STATUS.OK, name: "CheckerOk1" });
    }
  }
  class CheckerOk2 implements StartupCheck {
    startupCheck(): Promise<StartupStatus> {
      return Promise.resolve({ status: STARTUP_STATUS.OK, name: "CheckerOk2" });
    }
  }
  class CheckerFail1 implements StartupCheck {
    startupCheck(): Promise<StartupStatus> {
      return Promise.resolve({ status: STARTUP_STATUS.FAIL, name: "CheckerFail1" });
    }
  }
  class CheckerFail2 implements StartupCheck {
    startupCheck(): Promise<StartupStatus> {
      return Promise.resolve({ status: STARTUP_STATUS.FAIL, name: "CheckerFail2" });
    }
  }

  const ok1 = new CheckerOk1();
  const ok2 = new CheckerOk2();
  const fail1 = new CheckerFail1();
  const fail2 = new CheckerFail2();

  it("should return ok if all startup checks are ok", async () => {

    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, [ok1, ok2]);
    const expected = {
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.OK, services: [
        { name: "CheckerOk1", status: STARTUP_STATUS.OK },
        { name: "CheckerOk2", status: STARTUP_STATUS.OK }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return partially operational if at least one service status check is ok and at least one is not ok", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, [ok1, fail1]);
    const expected = {
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.PARTIALLY_OPERATIONAL, services: [
        { name: "CheckerOk1", status: STARTUP_STATUS.OK },
        { name: "CheckerFail1", status: STARTUP_STATUS.FAIL }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return fail if all service status checks failed", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, [fail1, fail2]);
    const expected = {
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.FAIL, services: [
        { name: "CheckerFail1", status: STARTUP_STATUS.FAIL },
        { name: "CheckerFail2", status: STARTUP_STATUS.FAIL }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return ok if no service status checks", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, []);
    const expected = { name: ROOT_COMPONENT, status: STARTUP_STATUS.OK, services: <StartupStatus[]>[] };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

});
