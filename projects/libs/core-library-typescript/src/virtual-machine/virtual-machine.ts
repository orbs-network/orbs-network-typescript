import { types } from "../common-library/types";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";

export class VirtualMachine {
  private stateStorage: types.StateStorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(stateStorage: types.StateStorageClient) {
    this.stateStorage = stateStorage;
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage);
  }

  public async processTransaction(input: types.ProcessTransactionInput) {
    const transactionScopeStateCache = new StateCache();

    return await this.processTransactionSet({orderedTransactions: [input.transaction]});
  }

  public async processTransactionSet(input: types.ProcessTransactionSetInput) {
    const stateCache = new StateCache();

    for (const transaction of input.orderedTransactions) {
      await this.processor.processTransaction({
        sender: transaction.sender,
        contractAddress: transaction.contractAddress,
        payload: transaction.payload
      }, stateCache);
    }

    return stateCache.getModifiedKeys();
  }

  public async callContract(input: types.CallContractInput) {
    return await this.processor.call({
      sender: input.sender,
      contractAddress: input.contractAddress,
      payload: input.payload
    });
  }
}
