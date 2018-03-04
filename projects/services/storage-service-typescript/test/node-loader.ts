import { types } from "orbs-core-library";
import { generateServiceIPCClient } from "./service-ipc-client";
import { tmpdir } from "os";
import * as path from "path";
import FakeGossipClient from "./fake-gossip-client";
import BlockStorageService from "../src/block-storage-service";
import * as fs from "fs-extra";

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

export class NodeLoader {
    name: string;
    levelDbPath: string;
    fakeGossipClient: FakeGossipClient;
    blockStorageService: BlockStorageService;

    constructor(nodeName: string) {
        this.name = nodeName;
        this.levelDbPath = `${tmpdir}/orbs-storage-${Date.now()}/${this.name}`;

        this.fakeGossipClient = new FakeGossipClient(nodeName);

        this.blockStorageService = new BlockStorageService(this.fakeGossipClient, {
            nodeName,
            pollInterval: 500,
            dbPath: this.levelDbPath
        });
    }

    getBlockStorageClient(): types.BlockStorageClient {
        return generateServiceIPCClient(this.blockStorageService);
    }

    addNodeToGossip(node: NodeLoader) {
        this.fakeGossipClient.addNode(node.name, {blockStorage: node.getBlockStorageClient()});
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

    // instantiate node
    for (let nodeIndex = 0; nodeIndex < numOfNodes; nodeIndex++) {
        const node = new NodeLoader(`node${nodeIndex}`);
        await node.initialize();
        await node.loadWithBlocks(blocks.slice(0, numOfBlocksPerNode[nodeIndex]));
        nodes.push(node);
    }

    // configure gossips
    for (const node of nodes) {
        for (const otherNode of nodes) {
            if (node != otherNode) {
                node.addNodeToGossip(otherNode);
            }
        }
    }

    return nodes;
}