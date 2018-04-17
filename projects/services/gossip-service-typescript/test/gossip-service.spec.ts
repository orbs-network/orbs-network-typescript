import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient } from "orbs-interfaces";
import GossipService from "../src/service";
import gossipServer from "../src/server";
import ConsensusService from "../../consensus-service-typescript/src/consensus-service";

const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

describe("gossip server test", function () {
  let server: GRPCServerBuilder;

  beforeEach(async () => {
    const gossipPort = await getPort();
    const endpoint = `127.0.0.1:${gossipPort}`;
    const anotherEndpoint = `127.0.0.1:${await getPort()}`;

    const topology =  {
      peers: [
        {
          service: "consensus",
          endpoint: endpoint,
        },
        {
          service: "storage",
          endpoint: endpoint,
        },
      ],
      gossipPort: gossipPort,
      gossipPeers: [ anotherEndpoint ]
    };

    const NODE_NAME = "tester";
    const SIGN_MESSAGES = false;
    const GOSSIP_PEER_POLL_INTERVAL = 5000;
    const gossipEnv = { NODE_NAME, SIGN_MESSAGES, GOSSIP_PEER_POLL_INTERVAL };
    const consensusServiceStub = stubInterface<ConsensusService>();

    server = gossipServer(topology, gossipEnv)
      .withService("Consensus", consensusServiceStub);

    return server.start();
  });

  it("dummy test", async () => {
    return expect(false).to.be.true;
  });

  afterEach(() => {
    return server.stop();
  });
});
