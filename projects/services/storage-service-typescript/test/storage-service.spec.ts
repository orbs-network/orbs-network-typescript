import * as mocha from "mocha";
import * as chai from "chai";
import * as fse from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as getPort from "get-port";
import * as chaiAsPromised from "chai-as-promised";
import { stubInterface } from "ts-sinon";
import * as request from "supertest";
import * as _ from "lodash";
import { types, BlockUtils, ErrorHandler, GRPCServerBuilder, grpc, logger, Address } from "orbs-core-library";
import { BlockStorageClient, StateStorageClient } from "orbs-interfaces";
import storageServer from "../src/server";
import GossipService from "../../gossip-service-typescript/src/service";
import TransactionPoolService from "../../consensus-service-typescript/src/transaction-pool-service";
import { STARTUP_STATUS, StartupStatus } from "../../../libs/core-library-typescript/src/common-library/startup-status";

const { expect } = chai;

const SERVER_IP_ADDRESS = "127.0.0.1";
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
        args: [1, 2, 3, 4, "some-other-arguments"]
      }),
      signatureData: {
        publicKey: undefined,
        signature: undefined
      }
    };
  });

  return BlockUtils.buildNextBlock({
    transactions: transactions,
    transactionReceipts: [],
    stateDiff: []
  });
}

let endpoint: string;

describe("BlockStorage service", function () {
  let server: GRPCServerBuilder;
  let blockClient: BlockStorageClient;
  let stateClient: StateStorageClient;
  let managementPort: number;
  beforeEach(async () => {
    endpoint = `${SERVER_IP_ADDRESS}:${await getPort()}`;
    const topology = {
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

    managementPort = await getPort();

    server = storageServer(topology, storageEnv)
      .withService("Gossip", gossipServerStub)
      .withService("TransactionPool", transactionPoolStub)
      .withManagementPort(managementPort)
      .onEndpoint(endpoint);

    blockClient = grpc.blockStorageClient({ endpoint });
    stateClient = grpc.stateStorageClient({ endpoint });

    logger.debug(`Starting Storage Service on ${endpoint}`);
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

  it("should return HTTP 200 and status ok when calling GET /admin/startupCheck on storage service (happy path)", async () => {

    const expected: StartupStatus = {
      name: "storage",
      status: STARTUP_STATUS.OK,
      services: [
        { name: "block-storage", status: STARTUP_STATUS.OK },
        { name: "state-storage", status: STARTUP_STATUS.OK }
      ]
    };

    return request(`http://${SERVER_IP_ADDRESS}:${managementPort}`)
      .get("/admin/startupCheck")
      .expect(200, expected);
  });

  // Here we are aiming to eliminate specific GRPC error;
  // expected result is to receive an error about block height because the block is invalid
  it("should send and receive big blocks", async function () {
    this.timeout(10000);

    const block = generateBigBrokenBlock();
    return expect(blockClient.addBlock({ block })).to.be.eventually.rejectedWith(`Got response [2 UNKNOWN: Invalid block height of block: {"version":0,"prevBlockHash":{"type":"Buffer","data":[]},"height":0}! Should have been 1] trying to call method [addBlock] service [BlockStorage] at endpoint [${endpoint}]`);
  });

  afterEach(() => {
    logger.debug(`Stopping Storage Service`);
    return server.stop();
  });
});

