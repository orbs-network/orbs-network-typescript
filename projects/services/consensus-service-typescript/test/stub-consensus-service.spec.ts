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

import { types, ErrorHandler, GRPCServerBuilder, grpc, logger } from "orbs-core-library";
import { GossipClient, ConsensusClient, GossipListenerInput } from "orbs-interfaces";

import consensusServer from "../src/consensus-server";
import GossipService from "../../gossip-service-typescript/src/service";


const { expect } = chai;

ErrorHandler.setup();

logger.configure({ level: "debug" });

chai.use(chaiAsPromised);

describe("stub consensus service tests", function() {
    let server: GRPCServerBuilder;
    let client: ConsensusClient;

    beforeEach(async () => {
        const endpoint = `127.0.0.1:${await getPort()}`;

        const fakeTopology = {
            peers: [
                {
                  service: "gossip",
                  endpoint: endpoint,
                },
                {
                  service: "storage",
                  endpoint: endpoint,
                },
                {
                  service: "sidechain-connector",
                  endpoint: endpoint,
                },
                {
                  service: "consensus",
                  endpoint: endpoint,
                },
                {
                  service: "virtual-machine",
                  endpoint: endpoint,
                },
              ]
        };

        const NODE_NAME = "tester";
        const NUM_OF_NODES = "2";
        const ETHEREUM_CONTRACT_ADDRESS = "localhost";
        const CONSENSUS_ALGORITHM = "stub";
        const CONSENSUS_LEADER_NODE_NAME = "tester";
        const fakeEnv = { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS, CONSENSUS_ALGORITHM, CONSENSUS_LEADER_NODE_NAME };

        const gossipServerStub = stubInterface<GossipService>();

        server = consensusServer(fakeTopology, fakeEnv)
            .withService("Gossip", gossipServerStub)
            .onEndpoint(endpoint);

        client = grpc.consensusClient({ endpoint });

        return server.start();
    });

    it("should be able to later stop the service", async () => {
        const gossipPayload: GossipListenerInput = {
            broadcastGroup: "consensus",
            messageType: "MyLastBlockHeight",
            buffer: new Buffer(JSON.stringify(0)),
            fromAddress: "invalid address"
        };

        expect(await client.gossipMessageReceived(gossipPayload)).to.not.throw;
    });

    afterEach(async () => {
        return server.stop();
    });
});
