import * as chai from "chai";
import * as fs from "fs";
import * as path from "path";
import * as getPort from "get-port";
import { stubInterface } from "ts-sinon";

import { types, BlockUtils, ErrorHandler, GRPCServerBuilder, grpc } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient, GossipServer } from "orbs-interfaces";
import storageServer from "../src/server";
import GossipService from "../../gossip-service-typescript/src/service";
import TransactionPoolService from "../../consensus-service-typescript/src/transaction-pool-service";

const { expect } = chai;

ErrorHandler.setup();

describe("new storage server test", function () {
  this.timeout(10000);
  let server: GRPCServerBuilder;
  let blockClient: BlockStorageClient;
  let stateClient: StateStorageClient;

  before(async () => {
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
    const BLOCK_STORAGE_DB_PATH = "./test/db/";
    const storageEnv = { NODE_NAME, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH };
    const gossipServerStub = stubInterface<GossipService>();
    const transactionPoolStub = stubInterface<TransactionPoolService>();

    // handle the filesystem for this test, will empty the db folder before starting the services
    // TODO: move outside, talk to kirill
    if (!fs.existsSync(BLOCK_STORAGE_DB_PATH)) {
      fs.mkdirSync(BLOCK_STORAGE_DB_PATH);
    }
    const files = fs.readdirSync(BLOCK_STORAGE_DB_PATH).map(f => path.join(BLOCK_STORAGE_DB_PATH, f));
    files.forEach(f => fs.unlinkSync(f));

    server = storageServer(topology, storageEnv)
      .withService("Gossip", gossipServerStub)
      .withService("TransactionPool", transactionPoolStub)
      .onEndpoint(endpoint);
    server.start();

    blockClient = grpc.blockStorageClient({ endpoint });
    stateClient = grpc.stateStorageClient({ endpoint });
  });

  it("should fetch genesis block for an empty database", async () => {
    const lastBlock = await blockClient.getLastBlock({});
    expect(lastBlock.block.header.height).to.equal(0);
  });

  it("checks state storage", async () => {
    const lastBlock = await blockClient.getLastBlock({});
    const nextBlock = BlockUtils.buildNextBlock({
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    }, lastBlock.block);
    blockClient.addBlock({ block: nextBlock });

    const state = await stateClient.readKeys({ contractAddress: { address: "does-not-exist" }, keys: [] });
    return expect(state).to.have.deep.property("values", {});
  });

  after(() => {
    return server.stop();
  });
});
