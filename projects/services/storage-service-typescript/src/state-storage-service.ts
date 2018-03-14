import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { StateStorage } from "orbs-core-library";

export default class StateStorageService extends Service {
  private stateStorage: StateStorage;

  private blockStorage: types.BlockStorageClient;

  public constructor(blockStorage: types.BlockStorageClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.blockStorage = blockStorage;
  }

  async initialize() {
    await this.initStateStorage();
  }

  async shutdown() {

  }

  async initStateStorage(): Promise<void> {
    this.stateStorage = new StateStorage(this.blockStorage);
    this.stateStorage.poll();
  }

  @Service.RPCMethod
  public async readKeys(rpc: types.ReadKeysContext) {
    const keys = await this.stateStorage.readKeys(rpc.req.contractAddress, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }
}
