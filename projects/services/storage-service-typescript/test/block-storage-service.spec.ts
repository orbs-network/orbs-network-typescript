import * as path from "path";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fsExtra from "fs-extra";
import { range } from "lodash";

import { types, BlockStorage, logger, grpc, ServiceRunner, ErrorHandler, topologyPeers, GRPCRuntime } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";
import GossipService from "../../gossip-service-typescript/src/service";

import { ClientMap } from "orbs-interfaces";

ErrorHandler.setup();

chai.use(chaiAsPromised);

const GOSSIP_GRPC_PORT_1 = 41151;
const GOSSIP_GRPC_PORT_2 = 61151;
const GOSSIP_GRPC_PORT_3 = 21151;
const BLOCK_STORAGE_GRPC_PORT_1 = 31151;
const BLOCK_STORAGE_GRPC_PORT_2 = 11151;
const BLOCK_STORAGE_GRPC_PORT_3 = 51151;

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
  nodeName: "node2",
  peers: [
    {
      service: "storage",
      endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_2}`,
    },
  ],
  gossipPort: 60002,
  gossipPeers: [ "ws://127.0.0.1:60001" ]
};

const gossipNode3 = {
  name: "gossip",
  version: "1.0.0",
  endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_3}`,
  project: "gossip-service-typescript",
  nodeName: "node3",
  peers: [
    {
      service: "storage",
      endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_3}`,
    },
  ],
  gossipPort: 60003,
  gossipPeers: [ "ws://127.0.0.1:60001", "ws://127.0.0.1:60002" ]
};

const blockStorage1 = {
  name: "storage",
  version: "1.0.0",
  endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_1}`,
  project: "storage-service-typescript",
  nodeName: "node1",
  dbPath: path.resolve("../../../db/test/blocks.db.1"),
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_1}`,
    },
  ],
  pollInterval: 100
};

const blockStorage2 = {
  name: "storage",
  version: "1.0.0",
  endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_2}`,
  project: "storage-service-typescript",
  nodeName: "node2",
  dbPath: path.resolve("../../../db/test/blocks.db.2"),
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_2}`,
    },
  ],
  pollInterval: 100
};

const blockStorage3 = {
  name: "storage",
  version: "1.0.0",
  endpoint: `0.0.0.0:${BLOCK_STORAGE_GRPC_PORT_3}`,
  project: "storage-service-typescript",
  nodeName: "node3",
  dbPath: path.resolve("../../../db/test/blocks.db.3"),
  peers: [
    {
      service: "gossip",
      endpoint: `0.0.0.0:${GOSSIP_GRPC_PORT_3}`,
    },
  ],
  pollInterval: 100
};

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

async function createBlockStorage(numberOfBlocks: number, levelDBPath: string) {
  const blockStorage = new BlockStorage(levelDBPath);
  await blockStorage.load();

  for (const i of range(0, numberOfBlocks)) {
    await blockStorage.addBlock(generateBlock(i));
  }

  return blockStorage.shutdown();
}

async function createNode(nodeName: string, gossipConfig: any, blockStorageConfig: any) {
  const gossipService = new GossipService({
    nodeName,
    nodeIp: "0.0.0.0",
    peers: topologyPeers(gossipConfig.peers),
    gossipPeers: gossipConfig.gossipPeers,
    gossipPort: gossipConfig.gossipPort
  });
  const blockStorageService = new BlockStorageService(topologyPeers(blockStorageConfig.peers).gossip, blockStorageConfig);
  const gossipGrpc = await ServiceRunner.run(grpc.gossipServer, gossipService, gossipConfig.endpoint);
  const blockGrpc = await ServiceRunner.run(grpc.blockStorageServer, blockStorageService, blockStorageConfig.endpoint);

  return { services: [gossipGrpc, blockGrpc] };
}

async function loadAllBlockStorages(): Promise<BlockStorage[]> {
  const storages = [];

  for (const config of [blockStorage1, blockStorage2, blockStorage3]) {
    const blockStorage = new BlockStorage(config.dbPath);
    await blockStorage.load();
    storages.push(blockStorage);
  }

  return storages;
}

describe("Block storage service", async function () {
  this.timeout(30000);

  let node1: any;
  let node2: any;
  let node3: any;

  let blockStorages: BlockStorage[];

  beforeEach(async () => {
    try {
      fsExtra.removeSync(blockStorage1.dbPath);
      fsExtra.removeSync(blockStorage2.dbPath);
      fsExtra.removeSync(blockStorage3.dbPath);
    } catch (e) { }

    await createBlockStorage(10, blockStorage1.dbPath);
    await createBlockStorage(20, blockStorage2.dbPath);
    await createBlockStorage(30, blockStorage3.dbPath);

    node1 = await createNode("node1", gossipNode1, blockStorage1);
    node2 = await createNode("node2", gossipNode2, blockStorage2);
  });

  afterEach(async () => {
    return Promise.all(blockStorages.map(s => s.shutdown()));
  });

  describe("sync process", () => {
    it("works with two nodes", (done) => {
      setTimeout(async () => {
        try {
          await ServiceRunner.stop(...node1.services, ...node2.services);
        } catch (e) {
          console.error(e);
        }

        blockStorages = await loadAllBlockStorages();
        const values = Promise.all([
            blockStorages[0].getLastBlockId(),
            blockStorages[1].getLastBlockId()
          ]);

        chai.expect(values).to.eventually.be.eql([20, 20]).and.notify(done);
      }, 3000);
    });

    it("works with multiple nodes", (done) => {
      createNode("node3", gossipNode3, blockStorage3).then((node) => {
        node3 = node;
      });

      setTimeout(async () => {
        try {
          await ServiceRunner.stop(...node1.services, ...node2.services, ...node3.services);
        } catch (e) {
          console.error(e);
        }

        blockStorages = await loadAllBlockStorages();
        const values = Promise.all([
            blockStorages[0].getLastBlockId(),
            blockStorages[1].getLastBlockId(),
            blockStorages[2].getLastBlockId()
          ]);

        chai.expect(values).to.eventually.be.eql([30, 30, 30]).and.notify(done);
      }, 5000);
    });

    xit("finishes if we keep adding more and more blocks to other nodes");

    xit("finishes even if node we sync from is dead");

    xit("successfully adds new blocks during sync");
  });
});
