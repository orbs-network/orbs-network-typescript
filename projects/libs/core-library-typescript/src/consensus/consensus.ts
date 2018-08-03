import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { BaseConsensusConfig, BaseConsensus } from "./base-consensus";
import { BenchmarkConsensus } from "./benchmark-consensus";
import { PBFTConsensus } from "./pbft-consensus";
import { StubConsensus } from "./stub-consensus";
import { StartupCheck } from "../common-library/startup-check";
import { StartupStatus, STARTUP_STATUS } from "../common-library/startup-status";

export class Consensus implements StartupCheck {
  private COMPONENT_NAME = "consensus";
  private actualConsensus: BaseConsensus;
  private config: BaseConsensusConfig;

  constructor(
    config: BaseConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, blockStorage: types.BlockStorageClient,
    transactionPool: types.TransactionPoolClient) {
    this.config = config;

    if (config.algorithm.toLowerCase() === "stub") {
      this.actualConsensus = new StubConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
    } else if (config.algorithm.toLowerCase() === "pbft") {
      this.actualConsensus = new PBFTConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
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

  public async startupCheck(): Promise<StartupStatus> {
    if (!this.actualConsensus) {
      return { name: this.COMPONENT_NAME, status: STARTUP_STATUS.FAIL, message: "Missing actualConsensus" };
    }

    return { name: this.COMPONENT_NAME, status: STARTUP_STATUS.OK };
  }

}
