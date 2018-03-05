import { types, logger } from "../common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";
import { stat } from "fs";

export class VirtualMachine {
  private stateStorage: types.StateStorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(stateStorage: types.StateStorageClient) {
    this.stateStorage = stateStorage;
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage);
  }

  public async processTransactionSet(input: types.ProcessTransactionSetInput): Promise<types.ProcessTransactionSetOutput> {
    const stateCache = new StateCache();
    const processedTransactions = [];

    for (const transaction of input.orderedTransactions) {
      const transactionScopeStateCache = stateCache.fork();
      try {
        await this.processor.processTransaction({
          sender: transaction.sender,
          contractAddress: transaction.contractAddress,
          payload: transaction.payload
        }, transactionScopeStateCache);

      } catch (err) {
        logger.error(`transaction ${JSON.stringify(transaction)} failed. error: ${err}`);
        continue;
      }

      stateCache.merge(transactionScopeStateCache.getModifiedKeys());
      processedTransactions.push(transaction);
    }

    const stateDiff = stateCache.getModifiedKeys().map(({ key, value}) => ({contractAddress: key.contractAddress, key: key.key, value }));

    return {
      stateDiff,
      processedTransactions
    };
  }

  public async callContract(input: types.CallContractInput) {
    return await this.processor.call({
      sender: input.sender,
      contractAddress: input.contractAddress,
      payload: input.payload
    });
  }
}
