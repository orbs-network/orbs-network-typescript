import * as mocha from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import { GRPCServerBuilder } from "../../src/common-library/grpc-server";
import { logger } from "../../src/common-library/logger";
import { Service } from "../../src/base-service/service";

const { expect } = chai;
chai.use(chaiAsPromised);

describe("GRPCServer cannot start if no services are attached to it", () => {


  it("should Promise.reject() if trying to start with no services attached", async () => {
    // This endpoint is not used, it's just so GRPCserver will not fail on missing endpoint
    const builder = new GRPCServerBuilder().onEndpoint("localhost:1234");
    const expectation = expect(builder.start()).to.be.rejectedWith("Mali was not set up correctly. did you forget to call withService()?");
    if (builder) {
      builder.stop();
    }
    return expectation;

  });
});

// TODO Move this logic to dedicated handler

describe("Filter out non-ServiceStatusChecker services", () => {

  // it("should filter out non-statusCheck services", () => {
  //   class ServiceOk1 implements ServiceStatusChecker {
  //     checkServiceStatus(): Promise<ServiceStatus> {
  //       return Promise.resolve({ status: STARTUP_CHECK_STATUS.OK, name: "okService1" });
  //     }
  //   }

  //   const service1 = new ServiceOk1();
  //   const foo = new Foo();

  //   const builder = new GRPCServerBuilder();
  //   const expectation = expect(builder.start()).to.be.rejectedWith("Mali was not set up correctly. did you forget to call withService()?");
  //   if (builder) {
  //     builder.stop();
  //   }
  //   return expectation;

  //  });


  it("should return 200 if all services are ok", () => { });

  it("should return 503 if not all services are ok", () => { });
});
