import { tmpdir } from "os";
import * as path from "path";
import * as fs from "fs-extra";

import { types, FakeGossipClient, generateFakeServiceIPCClient, TransactionPool } from "orbs-core-library";
import BlockStorageService from "../../storage-service-typescript/src/block-storage-service";
import TransactionPoolService from "../src/transaction-pool-service";

function generateBlock(prevBlockId: number): types.Block {
  return {
    header: {
      version: 0,
      id: prevBlockId + 1,
      prevBlockId: prevBlockId
    },
    transactions: [{ version: 0, contractAddress: "0", sender: "", signature: "", payload: "{}" }],
    stateDiff: []
  };
}

export class NodeLoader {
  name: string;
  levelDbPath: string;
  fakeGossipClient: FakeGossipClient;
  blockStorageService: BlockStorageService;
  transactionPoolService: TransactionPoolService;

  constructor(nodeName: string) {
    this.name = nodeName;
    this.levelDbPath = `${tmpdir}/orbs-storage-${Date.now()}/${this.name}`;

    this.fakeGossipClient = new FakeGossipClient(nodeName);

    this.blockStorageService = new BlockStorageService(this.fakeGossipClient, {
      nodeName,
      pollInterval: 100,
      dbPath: this.levelDbPath
    });

    this.transactionPoolService = new TransactionPoolService(new TransactionPool(this.fakeGossipClient), { nodeName });
  }

  getBlockStorageClient(): types.BlockStorageClient {
    return generateFakeServiceIPCClient(this.blockStorageService);
  }

  getTransactionPoolClient(): types.TransactionPoolClient {
    return generateFakeServiceIPCClient(this.transactionPoolService);
  }

  addNodeToGossip(node: NodeLoader) {
    this.fakeGossipClient.addNode(node.name, { blockStorage: node.getBlockStorageClient() });
  }

  async loadWithBlocks(blocks: types.Block[]) {
    for (const block of blocks) {
      const client = this.getBlockStorageClient();
      await client.addBlock({ block });
    }
  }

  async initialize() {
    await this.blockStorageService.initialize();
  }

  async cleanup() {
    await this.blockStorageService.shutdown();
    return new Promise((resolve, reject) => {
      fs.remove(this.levelDbPath, err => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  async getLastBlockId() {
    const res = await this.getBlockStorageClient().getLastBlockId({});
    return res.blockId;
  }
}

export async function initNodesWithBlocks(numOfBlocksPerNode: number[]): Promise<NodeLoader[]> {
  const numOfNodes = numOfBlocksPerNode.length;

  const nodes: NodeLoader[] = [];

  const blocks = [];

  for (let i = 0; i < Math.max(...numOfBlocksPerNode); i++) {
    blocks.push(generateBlock(i));
  }

  // Instantiate node.
  for (let nodeIndex = 0; nodeIndex < numOfNodes; nodeIndex++) {
    const node = new NodeLoader(`node${nodeIndex}`);
    await node.initialize();
    await node.loadWithBlocks(blocks.slice(0, numOfBlocksPerNode[nodeIndex]));
    nodes.push(node);
  }

  // Configure gossips.
  for (const node of nodes) {
    for (const otherNode of nodes) {
      if (node != otherNode) {
        node.addNodeToGossip(otherNode);
      }
    }
  }

  return nodes;
}