import { logger, config, types } from "orbs-common-library";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private consensus: RaftConsensus;

  constructor(config: RaftConsensusConfig) {
    this.consensus = new RaftConsensus(config);
  }

  public async sendTransaction(transactionContext: types.SendTransactionContext) {
    await this.consensus.onAppend(transactionContext.transaction, transactionContext.transactionAppendix);
  }
}
