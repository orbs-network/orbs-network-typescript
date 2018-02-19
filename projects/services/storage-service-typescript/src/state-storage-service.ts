import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { StateStorage } from "orbs-core-library";

export default class StateStorageService extends Service {
  private stateStorage: StateStorage;

  private blockStorage: types.BlockStorageClient;

  public constructor() {
    super();
  }

  async initialize() {
    this.blockStorage = this.peers.blockStorage;

    await this.initStateStorage();
  }

  async initStateStorage(): Promise<void> {
    this.stateStorage = new StateStorage(this.blockStorage);
    this.stateStorage.poll();
  }

  @Service.RPCMethod
  public async readKeys(rpc: types.ReadKeysContext) {
    const keys = await this.stateStorage.readKeys(rpc.req.address, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }
}
