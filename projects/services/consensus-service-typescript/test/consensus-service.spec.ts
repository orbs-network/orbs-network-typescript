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

describe("consensus service tests", function() {
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
        const fakeEnv = { NODE_NAME, NUM_OF_NODES, ETHEREUM_CONTRACT_ADDRESS };

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
            messageType: "RaftMessage",
            buffer: new Buffer(JSON.stringify({ from: 1, data: { to: 1 }})),
            fromAddress: "invalid address"
        };

        expect(await client.gossipMessageReceived(gossipPayload)).to.not.throw;
    });

    afterEach(async () => {
        return server.stop();
    });
});