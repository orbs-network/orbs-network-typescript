import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import BlockBuilder from "./block-builder";
import { BaseConsensusConfig, BaseConsensus } from "./base-consensus";

import { Gossip } from "../gossip";
import { Block } from "web3/types";
import { JsonBuffer } from "../common-library";

export class StubConsensus extends BaseConsensus {
  private transactionPool: types.TransactionPoolClient;
  private blockBuilder: BlockBuilder;
  private gossip: types.GossipClient;
  private blockStorage: types.BlockStorageClient;
  private config: BaseConsensusConfig;
  private lastBlockHeightByNodeName: Map<string, number> = new Map();
  private pollInterval: NodeJS.Timer;

  private configSanitation(key: string, value: any): any {
    if (key == "keyManager") {
      return undefined;
    }

    return value;
  }

  public constructor(
    config: BaseConsensusConfig,
    gossip: types.GossipClient,
    blockStorage: types.BlockStorageClient,
    transactionPool: types.TransactionPoolClient,
    virtualMachine: types.VirtualMachineClient
  ) {
    super();
    logger.info(`Starting stub consensus with configuration: ${JSON.stringify(config, this.configSanitation)}`);
    this.transactionPool = transactionPool;
    this.blockBuilder = new BlockBuilder({
      virtualMachine, transactionPool, blockStorage, newBlockBuildCallback: (block) => this.onNewBlockBuild(block),
      config: {
        sign: config.signBlocks,
        keyManager: config.keyManager,
        nodeName: config.nodeName,
        pollIntervalMs: config.blockBuilderPollInterval
      }
    });
    this.gossip = gossip;
    this.blockStorage = blockStorage;
    this.config = config;
    if (!config.leaderNodeName) {
      logger.error(`Stub consensus did not receive leader in configuration!`);
    } else {
      if (this.isLeader()) {
        logger.info(`Stub consensus - I am the leader`);
      }
    }
  }

  private isLeader(): boolean {
    return (this.config.nodeName == this.config.leaderNodeName);
  }

  private async onLeaderHeartbeatTick() {
    try {
      logger.debug("Stub consensus leader heartbeat tick");

      // get my last block according to my storage
      const { block } = await this.blockStorage.getLastBlock({});
      if (!block) {
        logger.debug(`Stub consensus leader heartbeat - block storage not initialized yet`);
        return;
      }
      const [myLastCommittedBlock, myLastCommittedBlockHeight] = [block, block.header.height];
      logger.debug(`Stub consensus leader heartbeat - my last block is ${JSON.stringify(myLastCommittedBlock)}`);

      // check if all other nodes are synchronized with me
      let areEnoughNodesSyncedWithMe = true;
      if (this.lastBlockHeightByNodeName.size < this.config.clusterSize - this.config.acceptableUnsyncedNodes - 1) {
        logger.debug(`Stub consensus leader heartbeat - missing some other nodes since we just see ${this.lastBlockHeightByNodeName.size}`);
        areEnoughNodesSyncedWithMe = false;
      } else {
        let howManyNodesAreNotSynced = 0;
        for (const [nodeName, lastBlockHeight] of this.lastBlockHeightByNodeName) {
          if (lastBlockHeight != myLastCommittedBlockHeight) {
            logger.debug(`Stub consensus leader heartbeat - last block of ${nodeName} is ${lastBlockHeight} while mine is ${myLastCommittedBlockHeight}`);
            howManyNodesAreNotSynced++;
          }
          if (howManyNodesAreNotSynced > this.config.acceptableUnsyncedNodes) {
            logger.debug(`Stub consensus leader heartbeat - There are ${howManyNodesAreNotSynced} out of sync.`);
            areEnoughNodesSyncedWithMe = false;
          }
        }
      }

      if (areEnoughNodesSyncedWithMe) {
        // they are synchronized, let's create a new block
        logger.debug(`Stub consensus leader heartbeat - everybody is synchronized, next block please`);
        this.blockBuilder.start();
      } else {
        // they are not synchronized, broadcast the last block again
        logger.debug(`Stub consensus leader heartbeat - I have ${myLastCommittedBlockHeight}, other nodes are not synchronized: ${JSON.stringify(this.lastBlockHeightByNodeName)}`);
        this.broadcastCommitBlock(myLastCommittedBlock);
      }

    } catch (err) {
      logger.error(`Stub consensus leader heartbeat,`, err);
    }
  }

  private async onCommitted(block: types.Block) {
    logger.debug(`New block to be committed ${JSON.stringify(block)}`);
    if (typeof block === "string") return;
    try {
      await this.blockBuilder.commitBlock(block);
    } catch (err) {
      logger.error(`Failed to commit block with height ${block.header.height},`, err);
    }
  }

  private async onNewBlockBuild(block: types.Block) {
    await this.onCommitted(block);
    await this.broadcastCommitBlock(block);
  }

  public broadcastCommitBlock(block: types.Block): void {
    this.gossip.broadcastMessage({
      broadcastGroup: "consensus",
      messageType: "CommitBlock",
      buffer: new Buffer(JSON.stringify(block)),
      immediate: true
    });
  }

  public sendMyLastBlockHeight(nodeId: string, data: any): void {
    this.gossip.unicastMessage({
      recipient: nodeId,
      broadcastGroup: "consensus",
      messageType: "MyLastBlockHeight",
      buffer: new Buffer(JSON.stringify(data)),
      immediate: true
    });
  }

  async reportMyLastBlock(address: string) {
    const { block } = await this.blockStorage.getLastBlock({});
    if (block) {
      this.sendMyLastBlockHeight(address, block.header.height);
    } else {
      logger.debug(`Block storage is not initialized yet`);
    }
  }

  async onMessageReceived(fromAddress: string, messageType: string, data: any): Promise<any> {
    switch (messageType) {
      case "CommitBlock":
        try {
          await this.onCommitted(data);
        } catch (err) {
          logger.error(`Failed to commit a`, err);
        }
        this.reportMyLastBlock(fromAddress);
        break;
      case "MyLastBlockHeight":
        this.lastBlockHeightByNodeName.set(fromAddress, data);
        break;
    }
  }

  async initialize(): Promise<any> {
    await this.blockBuilder.initialize();

    this.pollInterval = setInterval(async () => {
      if (this.isLeader()) {
        this.onLeaderHeartbeatTick();
      }
    }, this.config.heartbeatInterval);

  }

  async shutdown(): Promise<any> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      delete this.pollInterval;
    }
    await this.blockBuilder.shutdown();
  }

}
