import { types, ErrorHandler } from "orbs-core-library";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { delay } from "bluebird";
// import { initNodesWithBlocks, NodeLoader } from "../../storage-service-typescript/test/node-loader";

const { expect } = chai;

ErrorHandler.setup();

chai.use(chaiAsPromised);

describe("Transaction pool service", async function () {
  this.timeout(200000);

  describe("clean transaction pool", () => {
    xit("placeholder test");
  });
});
