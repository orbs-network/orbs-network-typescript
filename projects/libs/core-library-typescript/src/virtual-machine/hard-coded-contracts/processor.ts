import { types } from "../../common-library/types";
import { logger } from "../../common-library";
import { StateCache } from "../state-cache";
import { BaseContractStateAccessor, ContractStateReadOnlyAccessor, ContractStateReadWriteAccessor } from "../contract-state-accessor";

import { HardCodedSmartContractRegistry } from "./hard-coded-smart-contract-registry";
import { bs58EncodeRawAddress } from "../..";
import EthereumConnectedSmartContract from "./ethereum-connected-smart-contract";

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
  ethereumEndpoint: string;

  constructor(stateStorageClient: types.StateStorageClient, registry: HardCodedSmartContractRegistry, ethereumEndpoint?: string) {
    this.stateStorageClient = stateStorageClient;
    this.registry = registry;
    this.ethereumEndpoint = ethereumEndpoint;
  }

  public async processTransaction(request: CallRequest, stateCache: StateCache) {
    const writeAdapter = new ContractStateReadWriteAccessor(
      request.contractAddress,
      stateCache,
      this.stateStorageClient
    );

    logger.debug(`Processing transaction on contract ${bs58EncodeRawAddress(request.contractAddress)}`);
    await this.processMethod(request, writeAdapter);
  }

  public async call(request: CallRequest) {
    const transactionScopeStateCache = new StateCache();
    const readonlyAdapter = new ContractStateReadOnlyAccessor(
      request.contractAddress,
      transactionScopeStateCache,
      this.stateStorageClient
    );
    logger.debug(`Processing call contract on contract ${bs58EncodeRawAddress(request.contractAddress)}`);
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
    const contractClass = this.registry.getContractByRawAddress(request.contractAddress);
    if (contractClass == undefined) {
      throw new Error(`contract with address ${bs58EncodeRawAddress(request.contractAddress)} not registered`);
    }

    const { method, args } = this.parsePayload(request.payload);
    if (args == undefined) {
      throw new Error("Method arguments parsing falied, unable to proceed with method execution");
    }
    let contract: any;

    if (contractClass instanceof EthereumConnectedSmartContract) {
      contract = new contractClass.default(bs58EncodeRawAddress(request.sender), stateAdapter, this.ethereumEndpoint);
    } else {
      contract = new contractClass.default(bs58EncodeRawAddress(request.sender), stateAdapter);
    }

    logger.debug(`Executing method ${method} with args ${JSON.stringify(args)} on contract with address ${bs58EncodeRawAddress(request.contractAddress)}`);
    return contract[method](...args);
  }
}
