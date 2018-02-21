export interface StateCacheKey {
  contractAddress: string;
  key: string;
}

export class StateCache {
  private cache = new Map<string, string>();
  private modifiedKeys = new Set<string>();

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
    return [key.contractAddress, key.key].join("|");
  }

  private decodeMapKey(encodedKey: string): StateCacheKey {
    const [contractAddress, key] = encodedKey.split("|");
    return { contractAddress, key };
  }
}
