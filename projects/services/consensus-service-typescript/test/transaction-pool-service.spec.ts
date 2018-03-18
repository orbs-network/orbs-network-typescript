import { types, ErrorHandler } from "orbs-core-library";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { delay } from "bluebird";
import { initNodesWithBlocks, NodeLoader } from "./node-loader";

const { expect } = chai;

ErrorHandler.setup();

chai.use(chaiAsPromised);

describe("Transaction pool service", async function () {
  this.timeout(200000);

  describe("clean transaction pool", () => {
    let nodes: NodeLoader[] = [];

    it("bring up two nodes", async () => {
      nodes = await initNodesWithBlocks([10, 10]);

      const values = delay(2000).then(() => Promise.all(nodes.map(node => node.getLastBlockId())));

      return expect(values).to.eventually.be.eql([10, 10]);

    });

    afterEach(async () => {
      await Promise.all(nodes.map(node => node.cleanup()));
    });
  });
});

