import * as gaggle from "gaggle";
import { EventEmitter } from "events";

import { logger, types, config, topology, topologyPeers, CryptoUtils } from "orbs-common-library";

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

export default class RaftConsensus {
  private vm = topologyPeers(topology.peers).virtualMachine;
  private blockStorage = topologyPeers(topology.peers).blockStorage;

  private connector: RPCConnector;
  private node: any;
  private blockId: number;

  public constructor() {
    // Get the protocol configuration from the environment settings.
    const consensusConfig = config.get("consensus");
    if (!consensusConfig) {
      throw new Error("Couldn't find consensus configuration!");
    }

    this.blockId = 0;
    this.connector = new RPCConnector();

    this.node = gaggle({
      id: crypto.whoAmI(),
      clusterSize: consensusConfig.clusterSize,
      channel: {
        name: "custom",
        connector: this.connector
      },

      // How long to wait before declaring the leader dead?
      electionTimeout: {
        min: consensusConfig.electionTimeout.min,
        max: consensusConfig.electionTimeout.max,
      },

      // How often should the leader send heartbeats?
      heartbeatInterval: consensusConfig.heartbeatInterval
    });

    // Nodes will emit "committed" events whenever the cluster comes to consensus about an entry.
    //
    // Note: we might consider adding transactions as the result to the "appended" event, which will require further
    // synchronization, but will make everything a wee bit faster.
    this.node.on("committed", async (data: any) => {
      const txData = data.data;

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
  }

  // Suggests new entry to be appended to the Raft log (e.g., new transaction), by first executing the transaction and
  // then propagating the transaction with its execution outputs.
  async onAppend(tx: types.Transaction, txAppendix: types.TransactionAppendix) {
    const vmResult = await this.vm.executeTransaction({
      contractAddress: tx.contractAddress,
      sender: tx.sender,
      argumentsJson: tx.argumentsJson,
      prefetchAddresses: txAppendix.prefetchAddresses,
      lastBlockId: this.blockId
    });

    if (vmResult.success) {
      this.node.append({
        tx: tx,
        modifiedAddressesJson: vmResult.modifiedAddressesJson,
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
