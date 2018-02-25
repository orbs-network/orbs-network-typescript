import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private raftConsensus: RaftConsensus;

  constructor(options: RaftConsensusConfig, gossip: types.GossipClient, virtualMachine: types.VirtualMachineClient,
    blockStorage: types.BlockStorageClient, transactionPool: types.TransactionPoolClient) {
    this.raftConsensus = new RaftConsensus(options, gossip, virtualMachine, blockStorage, transactionPool);
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.raftConsensus.gossipMessageReceived(fromAddress, messageType, message);
  }
}
