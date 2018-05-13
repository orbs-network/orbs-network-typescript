
import * as chai from "chai";
import * as mocha from "mocha";
import { StartupChecker } from "../../src/common-library/startup-check";
import { StartupCheckComposite } from "../../src/common-library/startup-check-composite";
import { StartupCheckResult, STARTUP_CHECK_STATUS, ServiceStatus } from "../../src/common-library/startup-check-result";
import { ServiceStatusChecker } from "../../src/common-library/service-status-check";

const { expect } = chai;

describe("StartupCheckComposite", () => {

  class ServiceOk1 implements ServiceStatusChecker {
    checkServiceStatus(): Promise<ServiceStatus> {
      return Promise.resolve({ status: STARTUP_CHECK_STATUS.OK, name: "okService1" });
    }
  }
  class ServiceOk2 implements ServiceStatusChecker {
    checkServiceStatus(): Promise<ServiceStatus> {
      return Promise.resolve({ status: STARTUP_CHECK_STATUS.OK, name: "okService2" });
    }
  }
  class ServiceFail1 implements ServiceStatusChecker {
    checkServiceStatus(): Promise<ServiceStatus> {
      return Promise.resolve({ status: STARTUP_CHECK_STATUS.FAIL, name: "failService1" });
    }
  }
  class ServiceFail2 implements ServiceStatusChecker {
    checkServiceStatus(): Promise<ServiceStatus> {
      return Promise.resolve({ status: STARTUP_CHECK_STATUS.FAIL, name: "failService2" });
    }
  }

  const serviceOk1 = new ServiceOk1();
  const serviceOk2 = new ServiceOk2();
  const serviceFail1 = new ServiceFail1();
  const serviceFail2 = new ServiceFail2();

  it("should return ok if all service status chekcs are ok", async () => {

    const composite = new StartupCheckComposite([serviceOk1, serviceOk2]);
    const expected = {
      status: STARTUP_CHECK_STATUS.OK, services: [
        { name: "okService1", status: STARTUP_CHECK_STATUS.OK },
        { name: "okService2", status: STARTUP_CHECK_STATUS.OK }
      ]
    };

    const actual = await composite.startupCheck();

    expect(actual).to.deep.equal(expected);
  });

  it("should return partially operational if at least one service status check is ok and at least one is not ok", async () => {
    const composite = new StartupCheckComposite([serviceOk1, serviceFail1]);
    const expected = {
      status: STARTUP_CHECK_STATUS.PARTIALLY_OPERATIONAL, services: [
        { name: "okService1", status: STARTUP_CHECK_STATUS.OK },
        { name: "failService1", status: STARTUP_CHECK_STATUS.FAIL }
      ]
    };
    const actual = await composite.startupCheck();

    expect(actual).to.deep.equal(expected);

  });

  it("should return fail if all service status checks failed", async () => {
    const composite = new StartupCheckComposite([serviceFail1, serviceFail2]);
    const expected = {
      status: STARTUP_CHECK_STATUS.FAIL, services: [
        { name: "failService1", status: STARTUP_CHECK_STATUS.FAIL },
        { name: "failService2", status: STARTUP_CHECK_STATUS.FAIL }
      ]
    };
    const actual = await composite.startupCheck();

    expect(actual).to.deep.equal(expected);

  });


  it("should return ok if no service status checks", async () => {
    const composite = new StartupCheckComposite([]);
    const expected = { status: STARTUP_CHECK_STATUS.OK, services: <StartupChecker[]>[] };
    const actual = await composite.startupCheck();

    expect(actual).to.deep.equal(expected);

  });

});
