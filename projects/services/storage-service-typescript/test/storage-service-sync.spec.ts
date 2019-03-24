/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types, ErrorHandler } from "orbs-core-library";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { delay } from "bluebird";
import { initNodesWithBlocks, NodeLoader } from "./node-loader";

const { expect } = chai;

ErrorHandler.setup();

chai.use(chaiAsPromised);

describe("Block storage service", async function () {
  this.timeout(200000);

  describe("sync process", () => {
    let nodes: NodeLoader[] = [];

    it("works with two nodes", async () => {
      nodes = await initNodesWithBlocks([10, 20]);

      const values = delay(2000).then(() => Promise.all(nodes.map(node => node.getLastBlockHeight())));

      return expect(values).to.eventually.be.eql([20, 20]);

    });

    it("works with multiple nodes", async () => {
      nodes = await initNodesWithBlocks([10, 20, 50, 100]);

      const values = delay(2000).then(() => Promise.all(nodes.map(node => node.getLastBlockHeight())));

      return expect(values).to.eventually.be.eql([100, 100, 100, 100]);
    });

    xit("finishes if we keep adding more and more blocks to other nodes");

    xit("finishes even if node we sync from is dead");

    xit("successfully adds new blocks during sync");

    afterEach(async () => {
      await Promise.all(nodes.map(node => node.cleanup()));
    });
  });
});
