import { logger } from "../common-library/logger";
import { types } from "..";

export class InMemoryKVStore {
  private storeMap = new Map<string, string>();

  public async get(contractAddress: types.ContractAddress, key: string) {
    return this.getSync(contractAddress, key);
  }

  public async getMany(contractAddress: types.ContractAddress, keys: string[]) {
    const values = new Map<string, string>();

    for (const key of keys) {
      const value = this.getSync(contractAddress, key);
      if (value != undefined) {
        values.set(key, value);
      }
    }

    return values;
  }

  public async set(contractAddress: types.ContractAddress, key: string, value: string) {
    return this.setSync(contractAddress, key, value);
  }


  public async setMany(contractAddress: types.ContractAddress, values: Map<string, string>) {
    values.forEach((value: string, key: string) => {
      this.setSync(contractAddress, key, value);
    });
  }

  getSync(contractAddress: types.ContractAddress, key: string) {
    const mapKey = this.generateMapKeyString(contractAddress, key);
    return this.storeMap.get(mapKey);
  }

  setSync(contractAddress: types.ContractAddress, key: string, value: string) {
    const mapKey = this.generateMapKeyString(contractAddress, key);
    this.storeMap.set(mapKey, value);
    logger.debug(`stored ${contractAddress}.${key} with value ${value}`);
  }

  generateMapKeyString(contractAddress: types.ContractAddress, key: string) {
    // TODO: not sure this approach guarantees uniqueness of the key. insecure!
    return [contractAddress.address, key].join("|");
  }
}
