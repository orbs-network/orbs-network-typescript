import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private raftConsensus: RaftConsensus;

  constructor(options: RaftConsensusConfig, gossip: types.GossipClient, virtualMachine: types.VirtualMachineClient,
    blockStorage: types.BlockStorageClient) {
    this.raftConsensus = new RaftConsensus(options, gossip, virtualMachine, blockStorage);
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    await this.raftConsensus.sendTransaction(transactionContext.transaction, transactionContext.transactionAppendix);
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.raftConsensus.gossipMessageReceived(fromAddress, messageType, message);
  }
}
