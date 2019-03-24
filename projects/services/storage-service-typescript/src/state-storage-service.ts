/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig, StartupStatus, StartupCheck } from "orbs-core-library";
import { StateStorage } from "orbs-core-library";

export interface StateStorageServiceConfig extends ServiceConfig {
  pollInterval: number;
}

export default class StateStorageService extends Service implements StartupCheck {
  private stateStorage: StateStorage;

  private blockStorage: types.BlockStorageClient;
  private pollIntervalMs: number;

  public constructor(blockStorage: types.BlockStorageClient, serviceConfig: StateStorageServiceConfig) {
    super(serviceConfig);
    this.blockStorage = blockStorage;
    this.pollIntervalMs = serviceConfig.pollInterval;
  }

  async initialize() {
    await this.initStateStorage();
  }

  async shutdown() {
    this.stateStorage.stop();
  }

  async initStateStorage(): Promise<void> {
    this.stateStorage = new StateStorage(this.blockStorage, this.pollIntervalMs);
  }

  @Service.RPCMethod
  public async readKeys(rpc: types.ReadKeysContext) {
    const keys = await this.stateStorage.readKeys(rpc.req.contractAddress, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }

  public async startupCheck(): Promise<StartupStatus> {
    return this.stateStorage.startupCheck();
  }

}
