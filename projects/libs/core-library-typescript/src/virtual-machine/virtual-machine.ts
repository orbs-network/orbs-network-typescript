import { types, logger } from "../common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";
import { stat } from "fs";
import { Transaction } from "orbs-interfaces";

export class VirtualMachine {
  private stateStorage: types.StateStorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(stateStorage: types.StateStorageClient) {
    this.stateStorage = stateStorage;
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage);
  }

  public async processTransactionSet(input: types.ProcessTransactionSetInput): Promise<types.ProcessTransactionSetOutput> {
    const stateCache = new StateCache();
    const processedTransactions: Transaction[] = [];
    const rejectedTransactions: Transaction[] = [];

    for (const transaction of input.orderedTransactions) {
      const transactionScopeStateCache = stateCache.fork();
      try {
        await this.processor.processTransaction({
          sender: transaction.header.sender,
          payload: transaction.body.payload,
          contractAddress: transaction.body.contractAddress,
        }, transactionScopeStateCache);

      } catch (err) {
        logger.error(`transaction ${JSON.stringify(transaction)} failed. error: ${err}`);
        rejectedTransactions.push(transaction);
        continue;
      }

      stateCache.merge(transactionScopeStateCache.getModifiedKeys());
      processedTransactions.push(transaction);
    }

    const stateDiff = stateCache.getModifiedKeys().map(({ key, value}) => ({contractAddress: key.contractAddress, key: key.key, value }));

    if (rejectedTransactions.length > 0) {
      logger.error(`Virtual machine has rejected ${rejectedTransactions.length} transactions`);
    }

    return {
      stateDiff,
      processedTransactions,
      rejectedTransactions
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
