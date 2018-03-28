import { types } from "../../common-library/types";
import { StateCache, StateCacheKey } from "../state-cache";
import {
  BaseContractStateAccessor,
  ContractStateReadOnlyAccessor,
  ContractStateReadWriteAccessor
} from "../contract-state-accessor";

import BaseSmartContract from "./base-smart-contact";
import { HardCodedSmartContractRegistry } from "./hard-coded-smart-contract-registry";

export interface CallRequest {
  sender: types.UniversalAddress;
  payload: string;
  contractAddress: types.ContractAddress;
}

export default class HardCodedSmartContractProcessor {
  stateStorageClient: types.StateStorageClient;

  registry: HardCodedSmartContractRegistry;

  constructor(stateStorageClient: types.StateStorageClient, registry: HardCodedSmartContractRegistry) {
    this.stateStorageClient = stateStorageClient;
    this.registry = registry;
  }

  public async processTransaction(request: CallRequest, stateCache: StateCache) {
    const writeAdapter = new ContractStateReadWriteAccessor(
      request.contractAddress,
      stateCache,
      this.stateStorageClient
    );

    await this.processMethod(request, writeAdapter);
  }

  public async call(request: CallRequest) {
    const transactionScopeStateCache = new StateCache();
    const readonlyAdapter = new ContractStateReadOnlyAccessor(
      request.contractAddress,
      transactionScopeStateCache,
      this.stateStorageClient
    );
    return this.processMethod(request, readonlyAdapter);
  }

  private async processMethod(request: CallRequest, stateAdapter: BaseContractStateAccessor) {
    const Contract = this.registry.getContract(request.contractAddress.address);
    if (Contract == undefined) {
      throw new Error(`contract with address ${request.contractAddress} not registered`);
    }
    const contract = new Contract.default(request.sender.id, stateAdapter);

    const { method, args } = JSON.parse(request.payload);

    return contract[method](...args);
  }
}
