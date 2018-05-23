
import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig, StartupCheck, StartupStatus } from "orbs-core-library";
import { VirtualMachine } from "orbs-core-library";

export default class VirtualMachineService extends Service implements StartupCheck {
  private virtualMachine: VirtualMachine;

  public constructor(virtualMachine: VirtualMachine, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.virtualMachine = virtualMachine;
  }

  async initialize() {

  }

  async shutdown() {

  }

  @Service.RPCMethod
  public async processTransactionSet(rpc: types.ProcessTransactionSetContext) {
    rpc.res = await this.virtualMachine.processTransactionSet(rpc.req);
  }

  @Service.RPCMethod
  public async callContract(rpc: types.CallContractContext) {
    const result = await this.virtualMachine.callContract(rpc.req);

    rpc.res = {
      resultJson: JSON.stringify(result)
    };
  }

  public async startupCheck(): Promise<StartupStatus> {
    return this.virtualMachine.startupCheck();
  }

}
