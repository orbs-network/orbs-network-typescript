
import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { VirtualMachine } from "orbs-core-library";

export default class VirtualMachineService extends Service {
  private virtualMachine: VirtualMachine;

  public constructor(stateStorage: types.StateStorageClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);

    this.virtualMachine = new VirtualMachine(stateStorage);
  }

  async initialize() {

  }

  async shutdown() {

  }

  @Service.RPCMethod
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    // Currently only a "simple" contract type is supported
    try {
      const modifiedKeys = await this.virtualMachine.executeTransaction(rpc.req);

      rpc.res = {
        success: true,
        modifiedAddressesJson: modifiedKeys.map(({key, value}) => [key.key, value])
      };

    } catch (err) {
      logger.error("executeTransaction() error: " + err);

      rpc.res = { success: false, modifiedAddressesJson: undefined };
    }
  }

  @Service.RPCMethod
  public async callContract(rpc: types.CallContractContext) {
    const result = await this.virtualMachine.callContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result)
    };
  }
}
