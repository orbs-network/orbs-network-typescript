import { types, config, BlockStorage, logger, grpc, ServiceRunner, ErrorHandler } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";
import GossipService from "../../gossip-service-typescript/src/service";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinonChai from "sinon-chai";
import * as fsExtra from "fs-extra";

ErrorHandler.setup();

const GOSSIP_GRPC_PORT_1 = 41151;
const GOSSIP_GRPC_PORT_2 = 61151;
const BLOCK_STORAGE_GRPC_PORT_1 = 31151;
const BLOCK_STORAGE_GRPC_PORT_2 = 11151;

const gossipNode1 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_1}`,
  project: "gossip-service-typescript",
  peers: [
    {
      service: "storage",
      endpoint: `127.0.0.1:${BLOCK_STORAGE_GRPC_PORT_1}`,
    },
  ],
  gossipPort: 60001,
  gossipPeers: [ "ws://127.0.0.1:60002" ]
};

const gossipNode2 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_2}`,
  project: "gossip-service-typescript",
  peers: [
    {
      service: "storage",
      endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_2}`,
    },
  ],
  gossipPort: 60002,
  gossipPeers: [ "ws://0.0.0.0:60001" ]
};

const blockStorage1 = {
  name: "storage",
  version: "1.0.0",
  endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_1}`,
  project: "storage-service-typescript",
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_1}`,
    },
  ],
};

const blockStorage2 = {
  name: "storage",
  version: "1.0.0",
  endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_2}`,
  project: "storage-service-typescript",
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_2}`,
    },
  ],
};


const LEVELDB_PATH_1 = BlockStorage.LEVELDB_PATH + ".1";
const LEVELDB_PATH_2 = BlockStorage.LEVELDB_PATH + ".2";

describe("Block storage service", async function () {
  this.timeout(800000);

  let blockStorageService1: BlockStorageService;
  let blockStorageService2: BlockStorageService;
  let gossipService1: GossipService;
  let gossipService2: GossipService;
  let gossipGrpc1: any;
  let gossipGrpc2: any;
  let blockGrpc1: any;
  let blockGrpc2: any;

  beforeEach(async () => {
    try {
        fsExtra.removeSync(LEVELDB_PATH_1);
        fsExtra.removeSync(LEVELDB_PATH_2);
    } catch (e) { }

    config.set("NODE_IP", "0.0.0.0");

    config.set("NODE_NAME", "node1");
    config.set("LEVELDB_PATH", LEVELDB_PATH_1);

    gossipService1 = new GossipService(gossipNode1);
    blockStorageService1 = new BlockStorageService(blockStorage1);
    gossipGrpc1 = await ServiceRunner.run(grpc.gossipServer, gossipService1);
    blockGrpc1 = await ServiceRunner.run(grpc.blockStorageServer, blockStorageService1);

    config.set("NODE_NAME", "node2");
    config.set("LEVELDB_PATH", LEVELDB_PATH_2);

    gossipService2 = new GossipService(gossipNode2);
    blockStorageService2 = new BlockStorageService(blockStorage2);
    gossipGrpc2 = await ServiceRunner.run(grpc.gossipServer, gossipService2);
    blockGrpc2 = await ServiceRunner.run(grpc.blockStorageServer, blockStorageService2);
  });

  afterEach(async () => {
      // await [gossipService1.stop(), gossipService2.stop()];
      // await [blockStorageService1.stop(), blockStorageService1.stop()];
      // await ServiceRunner.shutdown(gossipGrpc1, gossipGrpc2, blockGrpc1, blockGrpc2);
      // await [gossipGrpc1.shutdown(), gossipGrpc2.shutdown(), blockGrpc1.shutdown(), blockGrpc2.shutdown()];
  });

  describe("sync process", () => {
    it("#pollForNewBlocks", (done) => {
      setTimeout(() => {

        done();
      }, 15000);
    });
  });

  after(() => {
    // process.exit(1);
  });
});
