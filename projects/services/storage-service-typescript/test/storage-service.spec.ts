import * as chai from "chai";
import * as fse from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as getPort from "get-port";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import * as _ from "lodash";

import { types, BlockUtils, ErrorHandler, GRPCServerBuilder, grpc, logger, Address } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient } from "orbs-interfaces";
import storageServer from "../src/server";
import GossipService from "../../gossip-service-typescript/src/service";
import TransactionPoolService from "../../consensus-service-typescript/src/transaction-pool-service";

const { expect } = chai;

chai.use(chaiAsPromised);

ErrorHandler.setup();

logger.configure({ level: "info" });

function generateBigBrokenBlock(): types.Block {
  const transactions: types.Transaction[] = _.map(_.range(40000), (i: number): types.Transaction => {
    return {
      header: {
        version: 0,
        sender: new Buffer("sender"),
        timestamp: new Date().getTime().toString(),
        contractAddress: new Buffer("contract-address")
      },
      payload: JSON.stringify({
        method: "someMethod",
        args: [ 1, 2, 3, 4, "some-other-arguments" ]
      })
    };
  });

  return BlockUtils.buildNextBlock({
    transactions: transactions,
    transactionReceipts: [],
    stateDiff: []
  });
}

describe("BlockStorage service", function () {
  let server: GRPCServerBuilder;
  let blockClient: BlockStorageClient;
  let stateClient: StateStorageClient;
  let endpoint: string;

  beforeEach(async () => {
    endpoint = `127.0.0.1:${await getPort()}`;

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
    const BLOCK_STORAGE_DB_PATH = path.join(os.tmpdir(), "orbsdbtest");
    const storageEnv = { NODE_NAME, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH, STATE_STORAGE_POLL_INTERVAL };
    const gossipServerStub = stubInterface<GossipService>();
    const transactionPoolStub = stubInterface<TransactionPoolService>();

    logger.info(`Folder used for db in tests is ${BLOCK_STORAGE_DB_PATH}`);

    // handle the filesystem for this test, will empty/create the db folder before starting the services
    fse.emptyDirSync(BLOCK_STORAGE_DB_PATH);

    server = storageServer(topology, storageEnv)
      .withService("Gossip", gossipServerStub)
      .withService("TransactionPool", transactionPoolStub)
      .onEndpoint(endpoint);

    blockClient = grpc.blockStorageClient({ endpoint });
    stateClient = grpc.stateStorageClient({ endpoint });

    // return the start promise to delay execution of the tests until its resolved (=services started) mocha plays nicely like that
    return server.start();
  });

  it("should fetch genesis block for an empty database", async () => {
    const lastBlock = await blockClient.getLastBlock({});
    return expect(lastBlock).to.have.property("block")
      .that.has.property("header")
      .that.has.property("height", 0);
  });

  it("state storage can return keys", async () => {
    // adding another block as currently the state storage polling will never return when the database has only the genesis block
    const lastBlock = await blockClient.getLastBlock({});
    const nextBlock = BlockUtils.buildNextBlock({
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    }, lastBlock.block);
    await blockClient.addBlock({ block: nextBlock });

    // this should take around 200 ms waiting for the polling
    const contractAddress = Address.createContractAddress("does-not-exist").toBuffer();
    const state = await stateClient.readKeys({ contractAddress, keys: [] });
    return expect(state).to.have.deep.property("values", {});
  });

  // Here we are aiming to eliminate specific GRPC error;
  // expected result is to receive an error about block height because the block is invalid
  it("should send and receive big blocks", async function () {
    this.timeout(10000);

    const block = generateBigBrokenBlock();
    return expect(blockClient.addBlock({ block })).to.be.eventually.rejectedWith(`Got response [2 UNKNOWN: Invalid block height of block: {"version":0,"prevBlockHash":{"type":"Buffer","data":[]},"height":0}! Should have been 1] trying to call method [addBlock] service [BlockStorage] at endpoint [${endpoint}]`);
  });

  afterEach(() => {
    return server.stop();
  });
});
