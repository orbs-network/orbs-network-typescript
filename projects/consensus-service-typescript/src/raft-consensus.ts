import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger, types, topology, topologyPeers, CryptoUtils } from "orbs-common-library";

const crypto = CryptoUtils.loadFromConfiguration();

// An RPC adapter to use with Gaggle's channels. We're using this adapter in order to implement the transport layer,
// for using Gaggle's "custom" channel (which we've extended ourselves).
class RPCConnector extends EventEmitter {
  private gossip = topologyPeers(topology.peers).gossip;

  public connect(): void {
  }

  public disconnect(): void {
  }

  public received(originNodeId: string, message: any): void {
    // Propagate broadcast messages or unicast messages from other nodes.
    if (message.to === undefined || message.to === crypto.whoAmI()) {
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
}

export interface RaftElectionOptions {
  min: number;
  max: number;
}

export interface RaftConsensusOptions {
  clusterSize: number;
  electionTimeout: RaftElectionOptions;
  heartbeatInterval: number;
}

export default class RaftConsensus {
  private vm = topologyPeers(topology.peers).virtualMachine;
  private blockStorage = topologyPeers(topology.peers).blockStorage;

  private connector: RPCConnector;
  private node: any;
  private blockId: number;

  public constructor(options: RaftConsensusOptions) {
    this.blockId = 0;
    this.connector = new RPCConnector();

    this.node = gaggle({
      id: crypto.whoAmI(),
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

      // Verify the sending node's signature, in order to avoid internal spam or miscommunication.
      if (crypto.verifySignature(msgData.signer, JSON.stringify(txData), msgData.signature)) {
        logger.debug(`Verified message from ${msgData.signer}, with signature ${msgData.signature}`);
      } else {
        logger.error(`Failed to verify message from ${msgData.signer}, with signature ${msgData.signature}! Aborting!`);
        return;
      }

      // Since we're currently storing single transactions per-block, we'd increase the block numbers for every
      // committed entry.
      this.blockId++;

      await this.blockStorage.addBlock({
        block: {
          tx: txData.tx,
          modifiedAddressesJson: txData.modifiedAddressesJson,
          id: this.blockId,
          prevBlockId: this.blockId - 1,
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
    const vmResult = await this.vm.executeTransaction({
      transaction: tx,
      transactionAppendix: txAppendix,
      lastBlockId: this.blockId
    });

    if (vmResult.success) {
      const msg = {
        tx: tx,
        modifiedAddressesJson: vmResult.modifiedAddressesJson
      };

      this.node.append({
        msg: msg,
        signer: this.node.id,
        signature: crypto.sign(JSON.stringify(msg))
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
