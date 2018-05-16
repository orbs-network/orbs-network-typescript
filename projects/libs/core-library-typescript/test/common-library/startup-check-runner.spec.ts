
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
    const expected = <StartupStatus>{
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.OK, childStartupStatuses: [
        { name: "CheckerOk1", status: STARTUP_STATUS.OK },
        { name: "CheckerOk2", status: STARTUP_STATUS.OK }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return partially operational if at least one service status check is ok and at least one is not ok", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, [ok1, fail1]);
    const expected = <StartupStatus>{
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.PARTIALLY_OPERATIONAL, childStartupStatuses: [
        { name: "CheckerOk1", status: STARTUP_STATUS.OK },
        { name: "CheckerFail1", status: STARTUP_STATUS.FAIL }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return fail if all service status checks failed", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, [fail1, fail2]);
    const expected = <StartupStatus>{
      name: ROOT_COMPONENT,
      status: STARTUP_STATUS.FAIL, childStartupStatuses: [
        { name: "CheckerFail1", status: STARTUP_STATUS.FAIL },
        { name: "CheckerFail2", status: STARTUP_STATUS.FAIL }
      ]
    };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

  it("should return ok if no service status checks", async () => {
    const startupCheckRunner = new StartupCheckRunner(ROOT_COMPONENT, []);
    const expected = <StartupStatus>{ name: ROOT_COMPONENT, status: STARTUP_STATUS.OK, childStartupStatuses: [] };
    const actual = await startupCheckRunner.run();
    expect(actual).to.deep.equal(expected);
  });

});
