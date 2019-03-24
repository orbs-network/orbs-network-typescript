/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { cloneDeep } from "lodash";
import { types, bs58DecodeRawAddress, bs58EncodeRawAddress } from "..";

export interface StateCacheKey {
  contractAddress: Buffer;
  key: string;
}

export class StateCache {
  private cache: Map<string, string>;
  private modifiedKeys: Set<string> = new Set<string>();

  constructor(cache = new Map<string, string>()) {
    this.cache = cache;
  }

  public get(key: StateCacheKey) {
    return this.cache.get(this.encodeMapKey(key));
  }

  public set(key: StateCacheKey, value: string, markIfModified: boolean = true) {
    const encodedKey = this.encodeMapKey(key);
    if (markIfModified) {
      const oldValue = this.cache.get(encodedKey);
      if (value != oldValue) {
        this.modifiedKeys.add(encodedKey);
      }
    }
    this.cache.set(encodedKey, value);
  }

  public getModifiedKeys(): {key: StateCacheKey, value: string}[] {
    const res = [];
    for (const key of this.modifiedKeys) {
      res.push({key: this.decodeMapKey(key), value: this.cache.get(key)});
    }
    return res;
  }

  private encodeMapKey(key: StateCacheKey) {
    // TODO: not sure this approach guarantees uniqueness of the key. insecure!
    return [bs58EncodeRawAddress(key.contractAddress), key.key].join(":");
  }

  private decodeMapKey(encodedKey: string): StateCacheKey {
    const [address, key] = encodedKey.split(":");
    const contractAddress = bs58DecodeRawAddress(address);
    return { contractAddress, key };
  }

  public fork() {
    return new StateCache(cloneDeep(this.cache));
  }

  public merge(modifiedKeys: {key: StateCacheKey, value: string}[]) {
    for (const item of modifiedKeys) {
      this.set(item.key, item.value);
    }
  }
}
