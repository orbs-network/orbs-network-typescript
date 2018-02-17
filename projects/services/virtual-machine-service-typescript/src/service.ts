
import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { VirtualMachine } from "orbs-core-library";

export default class VirtualMachineService extends Service {
  private virtualMachine: VirtualMachine;

  private stateStorage: types.StateStorageClient;

  async initialize() {
    this.stateStorage = this.peers.stateStorage;
    this.virtualMachine = new VirtualMachine(this.stateStorage);

    this.askForHeartbeats([this.stateStorage]);
  }

  @Service.RPCMethod
  public async executeTransaction(rpc: types.ExecuteTransactionContext) {
    // Currently only a "simple" contract type is supported
    try {
      const modifiedKeys = await this.virtualMachine.executeTransaction(rpc.req);

      rpc.res = {
        success: true,
        modifiedAddressesJson: JSON.stringify(_.fromPairs([...modifiedKeys].map(
          ([{ contractAddress, key }, value]) => [key, value])))
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
