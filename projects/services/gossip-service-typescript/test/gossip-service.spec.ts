/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
import { STARTUP_STATUS, StartupStatus, testStartupCheckHappyPath } from "orbs-core-library";

const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

chai.use(chaiAsPromised);

const SERVER_IP_ADDRESS = "127.0.0.1";
const COMPONENT_NAME = "gossip-service";

describe("gossip server test", function () {
  this.timeout(10000);
  let serverA: GRPCServerBuilder;
  let serverB: GRPCServerBuilder;
  let gossipAClient: GossipClient;
  let consensusStub: ConsensusService;
  let gossipManagementPort: number, anotherGossipManagementPort: number;


  beforeEach(async () => {
    // note about gossip connections: the grpc needs one endpoint,
    // and then the gossip port must be different as its websocket based unrelated to the grpc server/service
    const gossipPort = await getPort();
    const anotherGossipPort = await getPort();
    gossipManagementPort = await getPort();
    anotherGossipManagementPort = await getPort();
    const endpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;
    const anotherEndpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;

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
      gossipPeers: [`ws://${SERVER_IP_ADDRESS}:${anotherGossipPort}`]
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
      gossipPeers: [`ws://${SERVER_IP_ADDRESS}:${gossipPort}`]
    };

    let NODE_NAME = "testerA";
    const SIGN_MESSAGES = "false";
    const GOSSIP_PEER_POLL_INTERVAL = 1000;
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

  it("test polling", async () => {
    // longer delay, to ensure that polling will happen, if the below code then works the service is still okay and it did not crash the logic
    await bluebird.delay(1200);
    const buffer = new Buffer(JSON.stringify({ israel: "is70" }));
    await gossipAClient.broadcastMessage({ broadcastGroup: "consensus", messageType: "TEST_MESSAGE", buffer, immediate: true });
    // this delay is so we give the gossip time to actually send the message, it takes about 2 milliseconds,we must put a delay as there may be a race condition
    await bluebird.delay(200);
    expect((<sinon.SinonStub>consensusStub.gossipMessageReceived).callCount.toString()).to.equal("1");
  });

  it(`should return HTTP 200 and status ok when when calling GET /admin/startupCheck on ${COMPONENT_NAME} management port (with peers)`, async () => {
    // Wait for it to connect to peers
    await bluebird.delay(200);
    return testStartupCheckHappyPath(SERVER_IP_ADDRESS, gossipManagementPort, COMPONENT_NAME, ["gossip"]);
  });

  afterEach(() => {
    return Promise.all([serverA.stop(), serverB.stop()]);
  });
});

describe("testing gossip with no peers", function () {
  this.timeout(10000);
  let serverA: GRPCServerBuilder;
  let gossipAClient: GossipClient;
  let consensusStub: ConsensusService;

  let gossipManagementPort: number;

  beforeEach(async () => {
    // note about gossip connections: the grpc needs one endpoint,
    // and then the gossip port must be different as its websocket based unrelated to the grpc server/service
    const gossipPort = await getPort();
    gossipManagementPort = await getPort();
    const endpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;

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
      gossipPeers: [] as any
    };

    const NODE_NAME = "testerA";
    const SIGN_MESSAGES = "false";
    const GOSSIP_PEER_POLL_INTERVAL = 1000;
    const gossipEnv = { NODE_NAME, SIGN_MESSAGES, GOSSIP_PEER_POLL_INTERVAL };
    consensusStub = stubInterface<ConsensusService>();

    serverA = gossipServer(topology, gossipEnv)
      .withService("Consensus", consensusStub)
      .withManagementPort(gossipManagementPort)
      .onEndpoint(endpoint);

    gossipAClient = grpc.gossipClient({ endpoint });

    return serverA.start();
  });

  it("should work without peers", async () => {
    await bluebird.delay(200);
    const buffer = new Buffer(JSON.stringify({ israel: "is70" }));
    await gossipAClient.broadcastMessage({ broadcastGroup: "consensus", messageType: "TEST_MESSAGE", buffer, immediate: true });
    await bluebird.delay(200);
    expect((<sinon.SinonStub>consensusStub.gossipMessageReceived).callCount.toString()).to.equal("0");
  });

  it("polling should work without peers", async () => {
    await bluebird.delay(1200);
    const buffer = new Buffer(JSON.stringify({ israel: "is70" }));
    await gossipAClient.broadcastMessage({ broadcastGroup: "consensus", messageType: "TEST_MESSAGE", buffer, immediate: true });
    await bluebird.delay(200);
    expect((<sinon.SinonStub>consensusStub.gossipMessageReceived).callCount.toString()).to.equal("0");
  });

  afterEach(() => {
    return serverA.stop();
  });
});
