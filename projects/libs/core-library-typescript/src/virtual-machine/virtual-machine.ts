import * as _ from "lodash";

import { logger } from "../common-library/logger";
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
