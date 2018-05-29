import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import BlockBuilder from "./block-builder";
import { RaftConsensusConfig, BaseConsensus } from "./base-consensus";

import { Gossip } from "../gossip";
import { Block } from "web3/types";
import { JsonBuffer, KeyManager, BlockUtils } from "../common-library";

// An RPC adapter to use with Gaggle's channels. We're using this adapter in order to implement the transport layer,
// for using Gaggle's "custom" channel (which we've extended ourselves).
class RPCConnector extends EventEmitter {
  private id: string;
  private gossip: types.GossipClient;
  private debug: boolean;

  public constructor(id: string, gossip: types.GossipClient, debug: boolean) {
    super();

    this.id = id;
    this.gossip = gossip;
    this.debug = debug;
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
    if (this.debug) {
      const size = new Buffer(JSON.stringify(data)).length;
      logger.debug(`Raft broadcast message (${size} bytes): ${JSON.stringify(data)}`);
    }

    this.gossip.broadcastMessage({
      broadcastGroup: "consensus",
      messageType: "RaftMessage",
      buffer: new Buffer(JSON.stringify(data)),
      immediate: true
    });
  }

  public send(nodeId: string, data: any): void {
    if (this.debug) {
      const size = new Buffer(JSON.stringify(data)).length;
      logger.debug(`Raft unicast message (${size} bytes): ${JSON.stringify(data)}`);
    }

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

export class RaftConsensus extends BaseConsensus {
  private transactionPool: types.TransactionPoolClient;
  private blockBuilder: BlockBuilder;

  private connector: RPCConnector;
  private node: any;
  private raftIndex: number; // maintain consistency between gaggle log and storage
  private leaderIntervalMs: number;
  private leaderInterval: NodeJS.Timer;

  private pollIntervalMs: number;
  private pollInterval: NodeJS.Timer;

  private configSanitation(key: string, value: any): any {
    if (key == "keyManager") {
      return undefined;
    }

    return value;
  }

  public constructor(
    config: RaftConsensusConfig,
    gossip: types.GossipClient,
    blockStorage: types.BlockStorageClient,
    transactionPool: types.TransactionPoolClient,
    virtualMachine: types.VirtualMachineClient
  ) {
    super();
    logger.info(`Starting raft consensus with configuration: ${JSON.stringify(config, this.configSanitation)}`);

    this.pollIntervalMs = 3000;
    this.transactionPool = transactionPool;

    this.connector = new RPCConnector(config.nodeName, gossip, config.debug);

    this.blockBuilder = new BlockBuilder({
      virtualMachine, transactionPool, blockStorage, newBlockBuildCallback: (block) => this.onNewBlockBuild(block), config: {
        sign: config.signBlocks,
        keyManager: config.keyManager,
        nodeName: config.nodeName,
        pollIntervalMs: config.blockBuilderPollInterval,
        blockSizeLimit: config.blockSizeLimit
      }
    });
    this.blockBuilder.stop();
    this.raftIndex = -1;
    this.leaderIntervalMs = config.leaderIntervalMs;
    this.node = gaggle({
      id: config.nodeName,
      clusterSize: config.clusterSize,
      channel: {
        name: "custom",
        connector: this.connector
      },
      msgLimit: config.msgLimit,

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

    this.node.on("committed", async () => this.onCommitted());

    this.node.on("leaderElected", async () => this.onLeaderElected());

    this.node.inSync = function() {
      return this.raftIndex == this.node.getCommitIndex();
    };

  }


  // onCommitted triggered by raft consensus
  // The node is responsible to PULL the diff
  // Note: current implementation will commit invalid blocks - which will not be appended to block chain storage
  private async onCommitted() {
    const raftCommitIndex: number = this.node.getCommitIndex();
    let block: types.Block = undefined;
    let blockHash = "";
    if (this.raftIndex < raftCommitIndex) {
      const entries: any[] = await this.node.getBlocks(this.raftIndex, raftCommitIndex + 1);
      for (let i = 0; i < entries.length; i++) {
        try {
            const msg: types.ConsensusMessage = entries[i].data;
            // Since we're currently storing single transactions per-block, we'd increase the block numbers for every
            // committed entry.
            const start = new Date().getTime();
            block = JsonBuffer.parseJsonWithBuffers(JSON.stringify(msg.block));
            const end = new Date().getTime();


            blockHash = BlockUtils.calculateBlockHash(block).toString("hex");

            logger.debug(`onCommitted ${this.node.id}: New block with height ${block.header.height} and hash ${blockHash} is about to be committed (RAFT index ${this.raftIndex + i})`);

            logger.info(`Finished deserializing block with height ${block.header.height} and hash ${blockHash} in ${end - start} ms`);

            logger.info(`New block to be committed with height ${block.header.height} and hash ${blockHash}`);


            await this.blockBuilder.commitBlock(block);

            logger.info(`${this.node.id}: Successfully committed block with height ${block.header.height} and hash ${blockHash}, raftIndex ${this.raftIndex + i}`);
            const raftLog: any[] = this.node.getLog();
            const b = { blocks: await this.blockBuilder.getBlocks(0) };
            if (b.blocks != undefined) {
              let blockChainStr = "Node " + this.node.id + " Current block chain: ";

              // logger.info();
              for (let i = 0; i < b.blocks.length; i++) {
                const blockHash = BlockUtils.calculateBlockHash(b.blocks[i]).toString("hex");
                blockChainStr += "Height " + i + ":  " + blockHash +  "\n";
                // logger.info(`Height ${i}:  ${blockHash}`);

              }
              logger.info(blockChainStr);
              let rafLogStr = "Node " + this.node.id + "Current raft log: ";
              // logger.info(`Node ${this.node.id} Current raft log: `);
              for (let i = 0; i < raftLog.length; i++) {
                const blockHash = raftLog[i].term;
                // BlockUtils.calculateBlockHash(raftLog[i]).toString("hex");
                rafLogStr += "Height " + i + ":  term:" + raftLog[i].term + " data: " + raftLog[i].data + "\n";
                // logger.info(`Height ${i}:  ${blockHash}`);
              }
              logger.info(rafLogStr);
            }
        } catch (err) {
            // note: we maintain a sync routine with the raft log to update the storage state...
            // invalid blocks which are committed on raft are acceptable
            if (block != undefined)
                logger.error(`${this.node.id}: Failed to commit block with height ${block.header.height} and hash ${blockHash}: ${err}`);
            // if (this.node.isLeader())
            //     this.node.stepDown(); // -leader steps down (election time out will occur)
        }
      }
      this.raftIndex = raftCommitIndex;
      this.onLeaderElected();
    }
  }





  // leader will create block only if it is in sync
  private async onLeaderElected() {
    this.reportLeadershipStatus();

    if (this.leaderInterval) {
      clearInterval(this.leaderInterval);
    }

    if (this.node.isLeader()) {
      const raftCommitIndex: number = this.node.getCommitIndex();
      if (this.raftIndex >= raftCommitIndex) {  // Important: Assume Gaggle commit index is initialized to -1 !!
        logger.info(`Node ${this.node.id} was elected as a new leader! after update to blockchain ${this.raftIndex}:${raftCommitIndex}; local:remote`);
        this.blockBuilder.appendNextBlock();
      }
      else {
        this.leaderInterval = setInterval(async () => {
          try {
            logger.debug("new leader waits for transaction pool to update tick");
            this.onLeaderElected();
          } catch (err) {
            logger.error(`new leader error: ${err}`);
          }
        }, this.leaderIntervalMs);
      }
    }

  }

  async onMessageReceived(fromAddress: string, messageType: string, message: any): Promise<any> {
    switch (messageType) {
      case "RaftMessage": {
        this.connector.received(message.from, message.data);
      }
    }
  }

  public onNewBlockBuild(block: types.Block) {
    if (this.node.isLeader()) {
        const appendMessage: types.ConsensusMessage = { block };

        const blockHash = BlockUtils.calculateBlockHash(block).toString("hex");

        logger.debug(`onNewBlockBuilds ${this.node.id}:  New block with height ${block.header.height} and hash ${blockHash} is about to be appended to RAFT log`);

        this.node.append(appendMessage);
    }
  }

  async initialize(): Promise<any> {
    this.startReporting();
    return this.blockBuilder.initialize();
  }

  async shutdown(): Promise<any> {
    this.stopReporting();
    await Promise.all([this.node.close(), this.blockBuilder.shutdown()]);
  }

  public isLeader() {
    return this.node.isLeader();
  }

  private getConsensusState(): any {
    return {
      state: this.node._state,
      leader: this.node._leader,
      term: this.node._currentTerm,
      clusterSize: this.node._clusterSize,
      votes: JSON.stringify(this.node._votes),
      timeout: this.node._timeout
    };
  }

  private reportLeadershipStatus() {
    const status = this.isLeader() ? "the leader" : "not the leader";
    logger.debug(`Node is ${status}`);
    logger.debug(`Node state: `, this.getConsensusState());
  }

  private startReporting() {
    this.pollInterval = setInterval(() => {
      this.reportLeadershipStatus();
    }, this.pollIntervalMs);
  }

  private stopReporting() {
    clearInterval(this.pollInterval);
  }
}
