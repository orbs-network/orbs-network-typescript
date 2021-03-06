/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { logger } from "../common-library/logger";
import { types } from "..";

export class InMemoryKVStore {
  private storeMap = new Map<string, string>();

  public async get(contractAddress: Buffer, key: string) {
    return this.getSync(contractAddress, key);
  }

  public async getMany(contractAddress: Buffer, keys: string[]) {
    const values = new Map<string, string>();

    for (const key of keys) {
      const value = this.getSync(contractAddress, key);
      if (value != undefined) {
        values.set(key, value);
      }
    }
    return values;
  }

  public async set(contractAddress: Buffer, key: string, value: string) {
    return this.setSync(contractAddress, key, value);
  }


  public async setMany(contractAddress: Buffer, values: Map<string, string>) {
    values.forEach((value: string, key: string) => {
      this.setSync(contractAddress, key, value);
    });
  }

  getSync(contractAddress: Buffer, key: string) {
    const mapKey = this.generateMapKeyString(contractAddress, key);
    return this.storeMap.get(mapKey);
  }

  setSync(contractAddress: Buffer, key: string, value: string) {
    const mapKey = this.generateMapKeyString(contractAddress, key);
    this.storeMap.set(mapKey, value);
    logger.debug(`Stored ${mapKey} with value ${value}`);
  }

  generateMapKeyString(contractAddress: Buffer, key: string) {
    // TODO: not sure this approach guarantees uniqueness of the key. insecure!
    return `${contractAddress.toString("hex")}.${key}`;
  }
}
