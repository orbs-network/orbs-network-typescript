import { types, logger, StartupCheck, StartupStatus, STARTUP_STATUS } from "../common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";
import { stat } from "fs";
import { Transaction } from "orbs-interfaces";
import { HardCodedSmartContractRegistry, HardCodedSmartContractRegistryConfig } from "./hard-coded-contracts/hard-coded-smart-contract-registry";

export class VirtualMachine implements StartupCheck {

  public readonly SERVICE_NAME = "virtual-machine";
  private stateStorage: types.StateStorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(contractRegistryConfig: HardCodedSmartContractRegistryConfig, stateStorage: types.StateStorageClient) {
    this.stateStorage = stateStorage;
    this.processor = new HardCodedSmartContractProcessor(this.stateStorage, new HardCodedSmartContractRegistry(contractRegistryConfig));
  }

  public async processTransactionSet(input: types.ProcessTransactionSetInput): Promise<types.ProcessTransactionSetOutput> {
    const stateCache = new StateCache();
    const transactionReceipts: types.TransactionReceipt[] = [];

    for (const { txHash, transaction } of input.orderedTransactions) {
      const transactionScopeStateCache = stateCache.fork();
      let success: boolean = false;
      try {
        await this.processor.processTransaction({
          sender: transaction.header.sender,
          payload: transaction.payload,
          contractAddress: transaction.header.contractAddress,
        }, transactionScopeStateCache);
        success = true;
        logger.debug(`Transaction ${txHash.toString("hex")} has been processed successfully.`);
        stateCache.merge(transactionScopeStateCache.getModifiedKeys());
      } catch (err) {
        if (!err.expected) {
          logger.error(`Transaction ${txHash.toString("hex")} with payload ${JSON.stringify(transaction)} failed unexpectedly,`, err);
          throw err;
        } else {
          logger.info(`Transaction ${txHash.toString("hex")} with payload ${JSON.stringify(transaction)} failed,`, err);
          continue;
        }
      } finally {
        const transactionReceipt: types.TransactionReceipt = { txHash, success };
        transactionReceipts.push(transactionReceipt);
      }
    }

    const stateDiff = stateCache.getModifiedKeys().map(({ key, value }) => ({ contractAddress: key.contractAddress, key: key.key, value }));

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

  public async startupCheck(): Promise<StartupStatus> {

    if (!this.processor || !this.stateStorage) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Smart contract processor or State storage not initialized" };
    }

    if (!this.processor.call || !this.processor.processTransaction) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Bad impl of Smart contract processor. Either call() or processTransaction() do not exist" };
    }
    // Consider a deeper check here, in addition to checking that processor and stateStorage are defined
    return { name: this.SERVICE_NAME, status: STARTUP_STATUS.OK };

  }
}
