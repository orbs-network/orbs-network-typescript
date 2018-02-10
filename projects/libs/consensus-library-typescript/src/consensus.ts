import { logger, config, types } from "orbs-common-library";
import { Gossip } from "orbs-gossip-library";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private consensus: RaftConsensus;

  constructor(config: RaftConsensusConfig, gossip: Gossip) {
    this.consensus = new RaftConsensus(config, gossip);
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    await this.consensus.onAppend(transactionContext.transaction, transactionContext.transactionAppendix);
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.consensus.gossipMessageReceived(fromAddress, messageType, message);
  }
}
