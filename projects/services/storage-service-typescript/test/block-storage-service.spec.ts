import { types, config, BlockStorage, logger, grpc, ServiceRunner, ErrorHandler, topologyPeers } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";
import GossipService from "../../gossip-service-typescript/src/service";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fsExtra from "fs-extra";
import { range } from "lodash";

ErrorHandler.setup();

chai.use(chaiAsPromised);

const GOSSIP_GRPC_PORT_1 = 41151;
const GOSSIP_GRPC_PORT_2 = 61151;
const BLOCK_STORAGE_GRPC_PORT_1 = 31151;
const BLOCK_STORAGE_GRPC_PORT_2 = 11151;

const gossipNode1 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_1}`,
  project: "gossip-service-typescript",
  nodeName: "node1",
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
  nodeName: "node2",
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
  nodeName: "node1",
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
  nodeName: "node2",
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_2}`,
    },
  ],
};


const LEVELDB_PATH_1 = BlockStorage.LEVELDB_PATH + ".1";
const LEVELDB_PATH_2 = BlockStorage.LEVELDB_PATH + ".2";

function generateBlock(prevBlockId: number): types.Block {
    return {
        header: {
            version: 0,
            id: prevBlockId + 1,
            prevBlockId: prevBlockId
        },
        tx: { version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" },
        modifiedAddressesJson: "{}"
    };
}

async function createBlockStorage (numberOfBlocks: number) {
  const blockStorage = new BlockStorage();
  await blockStorage.load();

  for (const i of range(0, numberOfBlocks)) {
    await blockStorage.addBlock(generateBlock(i));
  }

  return blockStorage.shutdown();
}

describe("Block storage service", async function () {
  this.timeout(20000);

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

    config.set("LEVELDB_PATH", LEVELDB_PATH_1);
    await createBlockStorage(10);

    config.set("LEVELDB_PATH", LEVELDB_PATH_2);
    await createBlockStorage(20);

    config.set("NODE_IP", "0.0.0.0");

    config.set("NODE_NAME", "node1");
    config.set("LEVELDB_PATH", LEVELDB_PATH_1);

    const nodeConfig = {  };

    gossipService1 = new GossipService(gossipNode1);
    blockStorageService1 = new BlockStorageService(topologyPeers(blockStorage1.peers).gossip, blockStorage1);
    gossipGrpc1 = await ServiceRunner.run(grpc.gossipServer, gossipService1, gossipNode1.endpoint);
    blockGrpc1 = await ServiceRunner.run(grpc.blockStorageServer, blockStorageService1, blockStorage1.endpoint);

    config.set("NODE_NAME", "node2");
    config.set("LEVELDB_PATH", LEVELDB_PATH_2);

    gossipService2 = new GossipService(gossipNode2);
    blockStorageService2 = new BlockStorageService(topologyPeers(blockStorage2.peers).gossip, blockStorage2);
    gossipGrpc2 = await ServiceRunner.run(grpc.gossipServer, gossipService2, gossipNode2.endpoint);
    blockGrpc2 = await ServiceRunner.run(grpc.blockStorageServer, blockStorageService2, blockStorage2.endpoint);
  });

  describe("sync process", () => {
    it("#pollForNewBlocks", (done) => {
      setTimeout(async () => {
        try {
        await [blockStorageService1.stop(), gossipService1.stop(), blockStorageService2.stop(), gossipService2.stop()];

        } catch (e) {
          console.log(e);
        }
        config.set("LEVELDB_PATH", LEVELDB_PATH_1);
        const blockStorage = new BlockStorage();
        await blockStorage.load();

        chai.expect(blockStorage.getLastBlockId()).to.eventually.be.eql(20).and.notify(done);
      }, 15000);
    });
  });
});
