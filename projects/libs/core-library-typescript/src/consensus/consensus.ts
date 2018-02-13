import { logger } from "../common-library/logger";
import { config } from "../common-library/config";
import { types } from "../common-library/types";

import { Gossip } from "../gossip";

import { RaftConsensusConfig, RaftConsensus } from "./raft-consensus";

export class Consensus {
  private consensus: RaftConsensus;

  constructor(options: RaftConsensusConfig, gossip: types.GossipClient, virtualMachine: types.VirtualMachineClient,
    blockStorage: types.BlockStorageClient) {
    this.consensus = new RaftConsensus(options, gossip, virtualMachine, blockStorage);
  }

  public async sendTransaction(transactionContext: types.SendTransactionInput) {
    await this.consensus.onAppend(transactionContext.transaction, transactionContext.transactionAppendix);
  }

  async gossipMessageReceived(fromAddress: string, messageType: string, message: any) {
    await this.consensus.gossipMessageReceived(fromAddress, messageType, message);
  }
}
