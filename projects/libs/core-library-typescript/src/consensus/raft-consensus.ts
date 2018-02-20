import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

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
  private virtualMachine: types.VirtualMachineClient;
  private blockStorage: types.BlockStorageClient;

  private connector: RPCConnector;
  private node: any;
  private lastBlockId: number;

  public constructor(options: RaftConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, storage: types.BlockStorageClient) {
    this.virtualMachine = virtualMachine;
    this.blockStorage = storage;
    this.connector = new RPCConnector(options.nodeName, gossip);
    this.lastBlockId;

    this.node = gaggle({
      id: options.nodeName,
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
      const msg: types.ConsensusMessage = data.data;

      // Since we're currently storing single transactions per-block, we'd increase the block numbers for every
      // committed entry.
      await this.blockStorage.addBlock({
        block: msg.block
      });
      this.lastBlockId = msg.block.header.id;
    });

    this.node.on("leaderElected", () => {
      if (this.node.isLeader()) {
        logger.info(`Node ${this.node.id} was elected as a new leader!`);
      }
    });
  }

  private appendMessage(msg: types.ConsensusMessage) {
    this.node.append(msg);
  }

  // Suggests new entry to be appended to the Raft log (e.g., new transaction), by first executing the transaction and
  // then propagating the transaction with its execution outputs.
  async sendTransaction(tx: types.Transaction, txAppendix: types.TransactionAppendix) {
    const vmResult = await this.virtualMachine.executeTransaction({
      transaction: tx,
      transactionAppendix: txAppendix
    });

    if (vmResult.success) {
      const modifiedContractKeys = JSON.parse(vmResult.modifiedAddressesJson);
      const stateDiff = Object.keys(modifiedContractKeys).map((key): types.modifiedStateKey => (
        { contractAddress: tx.contractAddress,
          key,
          value: modifiedContractKeys[key]
        }));

        if (this.lastBlockId == undefined) {
          const { blockId } = await this.blockStorage.getLastBlockId({});
          this.lastBlockId = blockId;
        }

        const block: types.Block = {
        header: {
          version: 0,
          id: this.lastBlockId + 1,
          prevBlockId: this.lastBlockId
        },
        transactions: [tx],
        stateDiff,
      };

      this.appendMessage({ block });

      this.lastBlockId = block.header.id;
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
