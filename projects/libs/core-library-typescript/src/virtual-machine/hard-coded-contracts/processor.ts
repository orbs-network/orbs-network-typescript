import { types } from "../../common-library/types";
import { StateCache, StateCacheKey } from "../state-cache";
import {
  BaseContractStateAccessor,
  ContractStateReadOnlyAccessor,
  ContractStateReadWriteAccessor
} from "../contract-state-accessor";

import BaseSmartContract from "./base-smart-contact";
import { HardCodedSmartContractRegistry } from "./hard-coded-smart-contract-registry";
import { bs58EncodeRawAddress } from "../..";

// TODO: move to types and force the CallRequest to have that kind of payload?
export interface CallPayload {
  method: string;
  args: [number | string] | any[];
}

export interface CallRequest {
  sender: Buffer;
  payload: string;
  contractAddress: Buffer;
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

  private parsePayload(payload: string): CallPayload {
    try {
      return JSON.parse(payload);
    } catch (err) {
      throw new Error(`Unable to parse the method payload. Payload was: ${payload} Error was: ${err}`);
    }
  }

  private async processMethod(request: CallRequest, stateAdapter: BaseContractStateAccessor) {
    const Contract = this.registry.getContractByRawAddress(request.contractAddress);
    if (Contract == undefined) {
      throw new Error(`contract with address ${JSON.stringify(request.contractAddress)} not registered`);
    }

    const { method, args } = this.parsePayload(request.payload);
    const contract = new Contract.default(bs58EncodeRawAddress(request.sender), stateAdapter);

    return contract[method](...args);
  }
}
