
import * as chai from "chai";
import * as mocha from "mocha";
import { StartupCheck } from "../../src/common-library/startup-check";
import { StartupCheckComposite } from "../../src/common-library/startup-check-composite";
import { StartupCheckResult, STARTUP_CHECK_STATUS } from "../../src/common-library/startup-check-result";

const { expect } = chai;

describe("StartupCheckComposite", () => {

  class StartupCheckOk implements StartupCheck {
    startupCheck(): Promise<StartupCheckResult> {
      return Promise.resolve(<StartupCheckResult>{ status: STARTUP_CHECK_STATUS.OK, serviceName: "okService" });
    }
  }

  class StartupCheckFail implements StartupCheck {
    startupCheck(): Promise<StartupCheckResult> {
      return Promise.resolve(<StartupCheckResult>{ status: STARTUP_CHECK_STATUS.FAIL, serviceName: "okService" });
    }
  }

  const startupCheckOk = new StartupCheckOk();
  const startupCheckFail = new StartupCheckFail();

  it("should return ok if all child startup checks are ok", async () => {

    const composite = new StartupCheckComposite([startupCheckOk, startupCheckOk]);
    const actual = await composite.startupCheck();

    expect(actual.status).to.equal(STARTUP_CHECK_STATUS.OK);
  });

  it("should return fail if at least one child startup checks is not ok", async () => {
    const composite = new StartupCheckComposite([startupCheckOk, startupCheckFail]);
    const actual = await composite.startupCheck();

    expect(actual.status).to.equal(STARTUP_CHECK_STATUS.FAIL);

  });

  it("should return ok if no child startup checks", async () => {
    const composite = new StartupCheckComposite([]);
    const actual = await composite.startupCheck();

    expect(actual.status).to.equal(STARTUP_CHECK_STATUS.OK);

  });

});
