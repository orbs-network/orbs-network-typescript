/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types } from "../common-library/types";

import { StateCache } from "./state-cache";

export abstract class BaseContractStateAccessor {
  protected contractAddress: Buffer;

  constructor(contractAddress: Buffer) {
    this.contractAddress = contractAddress;
  }

  async load(key: string): Promise<string> {
    throw new Error("Not Implemented");
  }

  async store(key: string, value: string) {
    throw new Error("Not Implemented");
  }
}

export class ContractStateReadOnlyAccessor extends BaseContractStateAccessor {
  stateStorageClient: types.StateStorageClient;
  stateCache: StateCache;

  constructor(contractAddress: Buffer, stateCache: StateCache, stateStorageClient: types.StateStorageClient) {
    super(contractAddress);
    this.stateCache = stateCache;
    this.stateStorageClient = stateStorageClient;
    this.contractAddress = contractAddress;
  }

  async load(key: string) {
    const value = this.stateCache.get({ contractAddress: this.contractAddress, key });
    if (value != undefined)
      return value;

    const { values } = await this.stateStorageClient.readKeys({
      contractAddress: this.contractAddress,
      keys: [key]
    });
    return values[key];
  }

  async store(key: string, value: string) {
    throw new Error("read-only. storing values is not allowed");
  }
}

export class ContractStateReadWriteAccessor extends ContractStateReadOnlyAccessor {
  async store(key: string, value: string) {
    this.stateCache.set({ contractAddress: this.contractAddress, key }, value);
  }
}
