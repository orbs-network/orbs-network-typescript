import { logger, config, types } from "../common-library";
import { Gossip } from "../gossip";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private consensus: RaftConsensus;

  constructor(options: RaftConsensusConfig, virtualMachine: types.VirtualMachineClient,
    storage: types.StorageClient, gossip: Gossip) {
    this.consensus = new RaftConsensus(options, virtualMachine, storage, gossip);
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    await this.consensus.onAppend(transactionContext.transaction, transactionContext.transactionAppendix);
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.consensus.gossipMessageReceived(fromAddress, messageType, message);
  }
}
