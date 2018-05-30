import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { BaseConsensusConfig, BaseConsensus } from "./base-consensus";
import { BenchmarkConsensus } from "./benchmark-consensus";
import { StubConsensus } from "./stub-consensus";

export class Consensus {
  private actualConsensus: BaseConsensus;
  private config: BaseConsensusConfig;

  constructor(
    config: BaseConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, blockStorage: types.BlockStorageClient,
     transactionPool: types.TransactionPoolClient) {
      this.config = config;

    if (config.algorithm.toLowerCase() === "stub") {
      this.actualConsensus = new StubConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
    } else {
      this.actualConsensus = new BenchmarkConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
    }
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
