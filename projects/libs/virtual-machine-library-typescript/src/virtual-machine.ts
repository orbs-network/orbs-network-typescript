import * as _ from "lodash";

import { logger, topology, topologyPeers, types } from "orbs-common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";

export class VirtualMachine {
  private processor: HardCodedSmartContractProcessor;

  public constructor() {
    this.processor = new HardCodedSmartContractProcessor(topologyPeers(topology.peers).storage);
  }

  public async executeTransaction(input: types.ExecuteTransactionInput) {
    return await this.processor.processTransaction({
      sender: input.transaction.sender,
      contractAddress: input.transaction.contractAddress,
      payload: input.transaction.payload
    });
  }

  public async callContract(input: types.CallContractInput) {
    return await this.processor.call({
      sender: input.sender,
      contractAddress: input.contractAddress,
      payload: input.payload
    });
  }
}
