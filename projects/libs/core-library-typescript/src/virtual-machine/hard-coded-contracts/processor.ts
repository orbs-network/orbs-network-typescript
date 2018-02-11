import { types } from "../../common-library/types";
import { StateCache, StateCacheKey } from "../state-cache";
import {
  BaseContractStateAccessor,
  ContractStateReadOnlyAccessor,
  ContractStateReadWriteAccessor
} from "../contract-state-accessor";

import BaseSmartContract from "./base-smart-contact";

export interface CallRequest {
  sender: string;
  payload: string;
  contractAddress: string;
}

export default class HardCodedSmartContractProcessor {
  contractAddresses = new Map<string, any>();
  storageClient: types.StorageClient;

  constructor(stateStorageClient: types.StorageClient) {
    this.storageClient = stateStorageClient;

    // TODO: register it only in a testing environment via configuration
    this.registerContract("foobar-smart-contract", "foobar");
  }

  private registerContract(moduleName: string, toAddress: string) {
    // TODO: this loading method is not safe
    const contractModule = require(`./registry/${moduleName}`);
    this.contractAddresses.set(toAddress, contractModule);
  }

  public async processTransaction(request: CallRequest) {
    const transactionScopeStateCache = new StateCache();
    const writeAdapter = new ContractStateReadWriteAccessor(
      request.contractAddress,
      transactionScopeStateCache,
      this.storageClient
    );

    await this.processMethod(request, writeAdapter);

    // the cache documented all changes. TODO: cache will also set prefetched that don't change..
    return transactionScopeStateCache.getModifiedKeys();
  }

  public async call(request: CallRequest) {
    const transactionScopeStateCache = new StateCache();
    const readonlyAdapter = new ContractStateReadOnlyAccessor(
      request.contractAddress,
      transactionScopeStateCache,
      this.storageClient
    );
    return this.processMethod(request, readonlyAdapter);
  }

  private async processMethod(request: CallRequest, stateAdapter: BaseContractStateAccessor) {
    const Contract = this.contractAddresses.get(request.contractAddress);
    if (Contract == undefined) {
      throw new Error(`contract with address ${request.contractAddress} not registered`);
    }
    const contract = new Contract.default(request.sender, stateAdapter);

    const { method, args } = JSON.parse(request.payload);

    return contract[method](...args);
  }
}
