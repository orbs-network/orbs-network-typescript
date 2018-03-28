import { types, logger } from "../common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";

export class VirtualMachine {
  private stateStorage: types.StateStorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(stateStorage: types.StateStorageClient) {
    this.stateStorage = stateStorage;
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage);
  }

  public async processTransactionSet(input: types.ProcessTransactionSetInput): Promise<types.ProcessTransactionSetOutput> {
    const stateCache = new StateCache();
    const transactionReceipts: types.TransactionReceipt[] = [];

    for (const {txHash, transaction} of input.orderedTransactions) {
      const transactionScopeStateCache = stateCache.fork();
      let success: boolean = false;
      try {
        await this.processor.processTransaction({
          sender: transaction.header.sender,
          payload: transaction.body.payload,
          contractAddress: transaction.body.contractAddress,
        }, transactionScopeStateCache);
        success = true;
        stateCache.merge(transactionScopeStateCache.getModifiedKeys());
      } catch (err) {
        if (!err.expected) {
          throw err;
        } else {
          logger.error(`transaction ${JSON.stringify(transaction)} failed. error: ${err}`);
          continue;
        }
      } finally {
        const transactionReceipt: types.TransactionReceipt = { txHash, success};
        transactionReceipts.push(transactionReceipt);
      }
    }

    const stateDiff = stateCache.getModifiedKeys().map(({ key, value}) => ({contractAddress: key.contractAddress, key: key.key, value }));

    return {
      transactionReceipts,
      stateDiff
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
