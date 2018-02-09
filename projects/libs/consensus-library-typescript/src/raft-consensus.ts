import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger, types, topology, topologyPeers, config } from "orbs-common-library";

// An RPC adapter to use with Gaggle's channels. We're using this adapter in order to implement the transport layer,
// for using Gaggle's "custom" channel (which we've extended ourselves).
const NODE_NAME = config.get("NODE_NAME");

class RPCConnector extends EventEmitter {
  private gossip = topologyPeers(topology.peers).gossip;
  private id: string;

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
      BroadcastGroup: "consensus",
      MessageType: "RaftMessage",
      Buffer: new Buffer(JSON.stringify(data)),
      Immediate: true
    });
  }

  public send(nodeId: string, data: any): void {
    this.gossip.unicastMessage({
      Recipient: nodeId,
      BroadcastGroup: "consensus",
      MessageType: "RaftMessage",
      Buffer: new Buffer(JSON.stringify(data)),
      Immediate: true
    });
  }

  constructor(id: string) {
    super();
    this.id = id;
  }
}

export interface ElectionTimeoutConfig {
  min: number;
  max: number;
}

export interface RaftConsensusConfig {
  clusterSize: number;
  electionTimeout: ElectionTimeoutConfig;
  heartbeatInterval: number;
}

export class RaftConsensus {
  private virtualMachine = topologyPeers(topology.peers).virtualMachine;
  private storage = topologyPeers(topology.peers).storage;

  private connector: RPCConnector;
  private node: any;
  private lastBlockId: number;

  public constructor(options: RaftConsensusConfig) {
    this.lastBlockId = -1;
    this.connector = new RPCConnector(topology.name);

    this.node = gaggle({
      id: NODE_NAME,
      clusterSize: options.clusterSize,
      channel: {
        name: "custom",
        connector: this.connector
      },

      // How long to wait before declaring the leader dead?
      electionTimeout: {
        min: options.electionTimeout.min,
        max: options.electionTimeout.max,
      },

      // How often should the leader send heartbeats?
      heartbeatInterval: options.heartbeatInterval
    });

    // Nodes will emit "committed" events whenever the cluster comes to consensus about an entry.
    //
    // Note: we might consider adding transactions as the result to the "appended" event, which will require further
    // synchronization, but will make everything a wee bit faster.
    this.node.on("committed", async (data: any) => {
      const msgData = data.data;

      const txData = msgData.msg;

      // Since we're currently storing single transactions per-block, we'd increase the block numbers for every
      // committed entry.
      if (this.lastBlockId == -1) {
        const { blockId } = await this.storage.getLastBlockId({});
        this.lastBlockId = blockId;
      }

      this.lastBlockId++;

      await this.storage.addBlock({
        block: {
          header: {
            version: 0,
            id: this.lastBlockId,
            prevBlockId: this.lastBlockId - 1
          },
          tx: txData.tx,
          modifiedAddressesJson: txData.modifiedAddressesJson,
        }
      });
    });

    this.node.on("leaderElected", () => {
      if (this.node.isLeader()) {
        logger.info(`Node ${this.node.id} was elected as a new leader!`);
      }
    });
  }

  // Suggests new entry to be appended to the Raft log (e.g., new transaction), by first executing the transaction and
  // then propagating the transaction with its execution outputs.
  async onAppend(tx: types.Transaction, txAppendix: types.TransactionAppendix) {
    const vmResult = await this.virtualMachine.executeTransaction({
      transaction: tx,
      transactionAppendix: txAppendix,
      lastBlockId: this.lastBlockId
    });

    if (vmResult.success) {
      const msg = {
        tx: tx,
        modifiedAddressesJson: vmResult.modifiedAddressesJson
      };

      this.node.append({
        msg: msg
      });
    }
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    switch (messageType) {
      case "RaftMessage": {
        this.connector.received(message.from, message.data);
      }
    }
  }
}
