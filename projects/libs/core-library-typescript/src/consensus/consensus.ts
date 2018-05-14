import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, BaseConsensus } from "./base-consensus";
import { RaftConsensus } from "./raft-consensus";

export class Consensus {
  private actualConsensus: BaseConsensus;

  constructor(
    config: RaftConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, blockStorage: types.BlockStorageClient,
     transactionPool: types.TransactionPoolClient) {
    this.actualConsensus = new RaftConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
  }

  async initialize() {
    return this.actualConsensus.initialize();
  }

  async shutdown() {
    return this.actualConsensus.shutdown();
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.actualConsensus.onMessageReceived(fromAddress, messageType, message);
  }
}
