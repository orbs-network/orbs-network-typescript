import * as _ from "lodash";

import { logger, types } from "../common-library";

import HardCodedSmartContractProcessor from "./hard-coded-contracts/processor";
import { StateCache, StateCacheKey } from "./state-cache";

export class VirtualMachine {
  private storage: types.StorageClient;
  private processor: HardCodedSmartContractProcessor;

  public constructor(storage: types.StorageClient) {
    this.storage = storage;
    this.processor = new HardCodedSmartContractProcessor(this.storage);
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
