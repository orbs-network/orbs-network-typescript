import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";

import { types, BlockUtils, ErrorHandler, GRPCServerBuilder, grpc, logger, createContractAddress } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient } from "orbs-interfaces";
import GossipService from "../src/service";

const { expect } = chai;

ErrorHandler.setup();

describe("gossip server test", function () {
  // let server: GRPCServerBuilder;

  beforeEach(async () => {
    const endpoint = `127.0.0.1:${await getPort()}`;

    const topology =  {
      peers: [
        {
          service: "storage",
          endpoint: endpoint,
        },
        {
          service: "gossip",
          endpoint: endpoint,
        },
        {
          service: "consensus",
          endpoint: endpoint,
        },
      ],
    };

    const NODE_NAME = "tester";
    const BLOCK_STORAGE_POLL_INTERVAL = 5000;
    const STATE_STORAGE_POLL_INTERVAL = 200;
    const storageEnv = { NODE_NAME, BLOCK_STORAGE_POLL_INTERVAL,  STATE_STORAGE_POLL_INTERVAL };
    const gossipServerStub = stubInterface<GossipService>();

  });

  it("dummy test", async () => {
    return expect(false).to.be.true;
  });

  afterEach(() => {
  });
});
