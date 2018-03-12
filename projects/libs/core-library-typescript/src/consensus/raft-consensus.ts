import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import BlockBuilder from "./block-builder";

import { Gossip } from "../gossip";
import { Block } from "web3/types";

// An RPC adapter to use with Gaggle's channels. We're using this adapter in order to implement the transport layer,
// for using Gaggle's "custom" channel (which we've extended ourselves).
class RPCConnector extends EventEmitter {
  private id: string;
  private gossip: types.GossipClient;

  public constructor(id: string, gossip: types.GossipClient) {
    super();

    this.id = id;
    this.gossip = gossip;
  }

  public connect(): void {
  }

  public disconnect(): void {
  }

  public received(originNodeId: string, message: any): void {
    // Propagate broadcast messages or unicast messages from other nodes.
    if (message.to === undefined || message.to === this.id) {
      this.emit("received", originNodeId, message);
    }
  }

  public broadcast(data: any): void {
    this.gossip.broadcastMessage({
      broadcastGroup: "consensus",
      messageType: "RaftMessage",
      buffer: new Buffer(JSON.stringify(data)),
      immediate: true
    });
  }

  public send(nodeId: string, data: any): void {
    this.gossip.unicastMessage({
      recipient: nodeId,
      broadcastGroup: "consensus",
      messageType: "RaftMessage",
      buffer: new Buffer(JSON.stringify(data)),
      immediate: true
    });
  }
}

export interface ElectionTimeoutConfig {
  min: number;
  max: number;
}

export interface RaftConsensusConfig {
  nodeName: string;
  clusterSize: number;
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
}


export class RaftConsensus {
  private blockStorage: types.BlockStorageClient;
  private blockBuilder: BlockBuilder;
  private transactionPool: types.TransactionPoolClient;

  private connector: RPCConnector;
  private node: any;
  private lastBlockId: number;
  private readyForBlockAppend = false;
  private pollIntervalMs = 500;
  private pollInterval: NodeJS.Timer;

  public constructor(
    config: RaftConsensusConfig,
    gossip: types.GossipClient,
    blockStorage: types.BlockStorageClient,
    transactionPool: types.TransactionPoolClient,
    blockBuilder: BlockBuilder
  ) {
    this.blockStorage = blockStorage;
    this.connector = new RPCConnector(config.nodeName, gossip);
    this.blockBuilder = blockBuilder;
    this.transactionPool = transactionPool;

    this.node = gaggle({
      id: config.nodeName,
      clusterSize: config.clusterSize,
      channel: {
        name: "custom",
        connector: this.connector
      },

      // How long to wait before declaring the leader dead?
      electionTimeout: {
        min: config.electionTimeout.min,
        max: config.electionTimeout.max,
      },

      // How often should the leader send heartbeats?
      heartbeatInterval: config.heartbeatInterval
    });

    // Nodes will emit "committed" events whenever the cluster comes to consensus about an entry.
    //
    // Note: we might consider adding transactions as the result to the "appended" event, which will require further
    // synchronization, but will make everything a wee bit faster.

    this.node.on("committed", async (data: any) => this.onCommitted(data));

    this.node.on("leaderElected", () => this.onLeaderElected());

  }

  private async onCommitted(data: any) {
    const msg: types.ConsensusMessage = data.data;

    // Since we're currently storing single transactions per-block, we'd increase the block numbers for every
    // committed entry.
    const block: types.Block = msg.block;
    logger.debug("New block to be committed ${JSON.stringify(block)}");
    await this.blockStorage.addBlock({
      block: block
    });
    this.lastBlockId = block.header.id;

    await this.transactionPool.clearPendingTransactions({ transactions: block.transactions });

    if (this.node.isLeader()) {
      this.readyForBlockAppend = true;
    }
  }

  private async onLeaderElected() {
    if (this.node.isLeader()) {
      this.readyForBlockAppend = true;
      logger.info(`Node ${this.node.id} was elected as a new leader!`);
    } else {
      this.readyForBlockAppend = false;
    }
  }

  private pollForPendingTransactions() {
    this.pollInterval = setInterval(async () => {
      try {
        if (this.readyForBlockAppend) {
          await this.appendNextBlock();
        }
      } catch (err) {
        logger.error("newBlockAppendTick error: " + err);
      }
    }, this.pollIntervalMs);
  }

  private async appendNextBlock() {
    const lastBlockId = await this.getLastBlockId();
    const block = await this.blockBuilder.buildNextBlock(lastBlockId);

    const appendMessage: types.ConsensusMessage = {block};

    this.node.append(appendMessage);

    logger.debug(`Appended new block ${JSON.stringify(block)}`);

    this.readyForBlockAppend = false;
  }

  private async getLastBlockId() {
    if (this.lastBlockId == undefined) {
      const { blockId } = await this.blockStorage.getLastBlockId({});
      this.lastBlockId = blockId;
    }
    return this.lastBlockId;
  }

  async onMessageReceived(fromAddress: string, messageType: string, message: any) {
    switch (messageType) {
      case "RaftMessage": {
        this.connector.received(message.from, message.data);
      }
    }
  }

  async initialize() {
    this.pollForPendingTransactions();
  }

  async shutdown() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
