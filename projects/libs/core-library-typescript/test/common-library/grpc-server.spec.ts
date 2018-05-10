import * as mocha from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import { GRPCServerBuilder } from "../../src/common-library/grpc-server";
import { logger } from "../../src/common-library/logger";

const { expect } = chai;
chai.use(chaiAsPromised);

describe("GRPCServer cannot start if no services are attached to it", () => {


  it("should Promise.reject() if trying to start with no services attached", async () => {
    const builder = new GRPCServerBuilder();
    const expectation = expect(builder.start()).to.be.rejectedWith("Mali was not set up correctly. did you forget to call withService()?");
    if (builder) {
      builder.stop();
    }
    return expectation;

  });
});
