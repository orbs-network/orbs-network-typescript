import { tmpdir } from "os";
import * as path from "path";
import * as fs from "fs-extra";
import { stubInterface } from "ts-sinon";
import { types, BlockUtils, FakeGossipClient, generateServiceIPCClient } from "orbs-core-library";
import BlockStorageService from "../src/block-storage-service";

function generateEmptyBlock(prevBlock: types.Block): types.Block {
  return BlockUtils.buildNextBlock({transactions: [], stateDiff: [], transactionReceipts: []}, prevBlock);
}

export class NodeLoader {
  name: string;
  levelDbPath: string;
  fakeGossipClient: FakeGossipClient;
  blockStorageService: BlockStorageService;

  constructor(nodeName: string) {
    this.name = nodeName;
    this.levelDbPath = `${tmpdir}/orbs-storage-${Date.now()}/${this.name}`;

    this.fakeGossipClient = new FakeGossipClient(nodeName);

    this.blockStorageService = new BlockStorageService(this.fakeGossipClient, stubInterface<types.TransactionPoolClient>(), {
      nodeName,
      pollInterval: 100,
      dbPath: this.levelDbPath
    });
  }

  getBlockStorageClient(): types.BlockStorageClient {
    return generateServiceIPCClient(this.blockStorageService);
  }

  addNodeToGossip(node: NodeLoader) {
    this.fakeGossipClient.addNode(node.name, { blockStorage: node.getBlockStorageClient() });
  }

  async loadWithNullBlocks(numOfBlocks: number) {
    const client = this.getBlockStorageClient();
    let { block } = await client.getLastBlock({});
    console.log(block);

    for (let i = 0; i < numOfBlocks; i++) {
      block = generateEmptyBlock(block);
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

  async getLastBlockHeight() {
    const res = await this.getBlockStorageClient().getLastBlock({});
    return res.block.header.height;
  }
}

export async function initNodesWithBlocks(numOfBlocksPerNode: number[]): Promise<NodeLoader[]> {
  const numOfNodes = numOfBlocksPerNode.length;

  const nodes: NodeLoader[] = [];


  // Instantiate node.
  for (let nodeIndex = 0; nodeIndex < numOfNodes; nodeIndex++) {
    const node = new NodeLoader(`node${nodeIndex}`);
    await node.initialize();
    await node.loadWithNullBlocks(numOfBlocksPerNode[nodeIndex]);
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
