import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";
import BlockBuilder from "./block-builder";

export class Consensus {
  private raftConsensus: RaftConsensus;

  constructor(
    config: RaftConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, blockStorage: types.BlockStorageClient,
     transactionPool: types.TransactionPoolClient) {
    this.raftConsensus = new RaftConsensus(
      config, gossip, blockStorage, transactionPool, new BlockBuilder({ virtualMachine, transactionPool }));
  }

  async initialize() {
    return this.raftConsensus.initialize();
  }

  async shutdown() {
    return this.raftConsensus.shutdown();
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.raftConsensus.onMessageReceived(fromAddress, messageType, message);
  }
}
