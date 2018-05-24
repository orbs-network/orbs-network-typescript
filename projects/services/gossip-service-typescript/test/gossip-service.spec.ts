import * as mocha from "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";
import * as sinon from "sinon";
import * as bluebird from "bluebird";

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger, Gossip } from "orbs-core-library";
import { GossipClient } from "orbs-interfaces";
import GossipService from "../src/service";
import gossipServer from "../src/server";
import ConsensusService from "../../consensus-service-typescript/src/consensus-service";

const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

chai.use(chaiAsPromised);

describe("gossip server test", function () {
  this.timeout(10000);
  let serverA: GRPCServerBuilder;
  let serverB: GRPCServerBuilder;
  let gossipAClient: GossipClient;
  let consensusStub: ConsensusService;

  beforeEach(async () => {
    // note about gossip connections: the grpc needs one endpoint,
    // and then the gossip port must be different as its websocket based unrelated to the grpc server/service
    const gossipPort = await getPort();
    const anotherGossipPort = await getPort();
    const gossipManagementPort = await getPort();
    const anotherGossipManagementPort = await getPort();
    const endpoint = `127.0.0.1:${await getPort()}`;
    const anotherEndpoint = `127.0.0.1:${await getPort()}`;

    const topology = {
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
      gossipPeers: [`ws://127.0.0.1:${anotherGossipPort}`]
    };

    const anotherTopology = {
      peers: [
        {
          service: "consensus",
          endpoint: anotherEndpoint,
        },
        {
          service: "storage",
          endpoint: anotherEndpoint,
        },
      ],
      gossipPort: anotherGossipPort,
      gossipPeers: [`ws://127.0.0.1:${gossipPort}`]
    };

    let NODE_NAME = "testerA";
    const SIGN_MESSAGES = "false";
    const GOSSIP_PEER_POLL_INTERVAL = 5000;
    const gossipEnv = { NODE_NAME, SIGN_MESSAGES, GOSSIP_PEER_POLL_INTERVAL };
    consensusStub = stubInterface<ConsensusService>();

    serverA = gossipServer(topology, gossipEnv)
      .withService("Consensus", consensusStub)
      .withManagementPort(gossipManagementPort)
      .onEndpoint(endpoint);


    NODE_NAME = "testerB";
    const gossipBEnv = { NODE_NAME, SIGN_MESSAGES, GOSSIP_PEER_POLL_INTERVAL };

    serverB = gossipServer(anotherTopology, gossipBEnv)
      .withService("Consensus", consensusStub)
      .withManagementPort(anotherGossipManagementPort)
      .onEndpoint(anotherEndpoint);


    gossipAClient = grpc.gossipClient({ endpoint });

    return Promise.all([serverA.start(), serverB.start()]);
  });

  it("test broadcast", async () => {
    // delay to let gossip finish registering the above 'servers'
    await bluebird.delay(200);
    const buffer = new Buffer(JSON.stringify({ israel: "is70" }));
    await gossipAClient.broadcastMessage({ broadcastGroup: "consensus", messageType: "TEST_MESSAGE", buffer, immediate: true });
    // this delay is so we give the gossip time to actually send the message, it takes about 2 milliseconds,we must put a delay as there may be a race condition
    await bluebird.delay(200);
    expect((<sinon.SinonStub>consensusStub.gossipMessageReceived).callCount.toString()).to.equal("1");
  });

  afterEach(() => {
    return Promise.all([serverA.stop(), serverB.stop()]);
  });
});
