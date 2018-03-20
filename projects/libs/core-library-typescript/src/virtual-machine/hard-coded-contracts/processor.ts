import { types } from "../../common-library/types";
import { StateCache, StateCacheKey } from "../state-cache";
import {
  BaseContractStateAccessor,
  ContractStateReadOnlyAccessor,
  ContractStateReadWriteAccessor
} from "../contract-state-accessor";

import BaseSmartContract from "./base-smart-contact";

export interface CallRequest {
  sender: types.UniversalAddress;
  payload: string;
  contractAddress: types.ContractAddress;
}

export default class HardCodedSmartContractProcessor {
  contractAddresses = new Map<string, any>();
  stateStorageClient: types.StateStorageClient;

  constructor(stateStorageClient: types.StateStorageClient) {
    this.stateStorageClient = stateStorageClient;

    // TODO: register it only in a testing environment via configuration
    this.registerContract("foobar-smart-contract", "foobar");
    this.registerContract("text-message-smart-contract", "text-message");
  }

  private registerContract(moduleName: string, toAddress: string) {
    // TODO: this loading method is not safe
    const contractModule = require(`./registry/${moduleName}`);
    this.contractAddresses.set(toAddress, contractModule);
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
    const Contract = this.contractAddresses.get(request.contractAddress.address);
    if (Contract == undefined) {
      throw new Error(`contract with address ${request.contractAddress} not registered`);
    }
    const contract = new Contract.default(request.sender.id, stateAdapter);

    const { method, args } = JSON.parse(request.payload);

    return contract[method](...args);
  }
}
