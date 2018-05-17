import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, BaseConsensus } from "./base-consensus";
import { RaftConsensus } from "./raft-consensus";
import { StubConsensus } from "./stub-consensus";

export class Consensus {
  private pollIntervalMs: number;
  private pollInterval: NodeJS.Timer;
  private actualConsensus: BaseConsensus;
  private config: RaftConsensusConfig;

  constructor(
    config: RaftConsensusConfig, gossip: types.GossipClient,
    virtualMachine: types.VirtualMachineClient, blockStorage: types.BlockStorageClient,
     transactionPool: types.TransactionPoolClient) {
      this.config = config;

    if (config.algorithm.toLowerCase() === "stub") {
      this.actualConsensus = new StubConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
    } else {
      this.actualConsensus = new RaftConsensus(config, gossip, blockStorage, transactionPool, virtualMachine);
    }

    this.pollIntervalMs = 100;
  }

  async initialize() {
    this.reportLeadershipStatus();
    return this.actualConsensus.initialize();
  }

  async shutdown() {
    this.stopReporting();
    return this.actualConsensus.shutdown();
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.actualConsensus.onMessageReceived(fromAddress, messageType, message);
  }

  private reportLeadershipStatus() {
    if (this.config.algorithm.toLowerCase() !== "raft") {
      return;
    }

    this.pollInterval = setInterval(async () => {
      const RaftConsensus = <RaftConsensus>this.actualConsensus;

      const status = raftConsensus.isLeader() ? "the leader" : "not the leader";
      logger.debug(`Node is ${status}`);
      logger.debug(`Node state: `, {
        state: raftConsensus.getState(),
        leader: raftConsensus.getLeader(),
        term: raftConsensus.getTerm(),
        clusterSize: raftConsensus.getClusterSize(),
        votes: raftConsensus.getVotes(),
        timeout: raftConsensus.getElectionTimeout()
      });
    }, this.pollIntervalMs);
  }

  private stopReporting() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

}
