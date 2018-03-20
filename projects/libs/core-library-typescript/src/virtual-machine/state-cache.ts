import { cloneDeep } from "lodash";
import { types } from "..";

export interface StateCacheKey {
  contractAddress: types.ContractAddress;
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
    return [key.contractAddress.address, key.key].join("|");
  }

  private decodeMapKey(encodedKey: string): StateCacheKey {
    const [address, key] = encodedKey.split("|");
    const contractAddress: types.ContractAddress = { address };
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
