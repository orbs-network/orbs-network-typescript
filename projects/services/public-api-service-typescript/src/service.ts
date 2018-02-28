import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApi } from "orbs-core-library";

class ConstantTransactionHandlerConfig implements TransactionHandlerConfig {
  validateSubscription(): boolean {
    return true;
  }
}

export default class PublicApiService extends Service {
  private publicApi: PublicApi;

  private virtualMachine: types.VirtualMachineClient;
  private consensus: types.ConsensusClient;
  private subscriptionManager: types.SubscriptionManagerClient;
  private transactionHandler: TransactionHandler;

  public constructor(virtualMachine: types.VirtualMachineClient, consensus: types.ConsensusClient, subscriptionManager: types.SubscriptionManagerClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.virtualMachine = virtualMachine;
    this.consensus = consensus;
    this.subscriptionManager = subscriptionManager;

    this.transactionHandler = new TransactionHandler(this.consensus, this.subscriptionManager, new ConstantTransactionHandlerConfig());

    this.publicApi = new PublicApi(this.transactionHandler, this.virtualMachine);
  }

  async initialize() {

  }

  async shutdown() {

  }

  @Service.RPCMethod
  async sendTransaction(rpc: types.SendTransactionContext) {
    await this.publicApi.sendTransaction(rpc.req);
  }

  @Service.RPCMethod
  async call(rpc: types.CallContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${this.config.nodeName}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }
}
