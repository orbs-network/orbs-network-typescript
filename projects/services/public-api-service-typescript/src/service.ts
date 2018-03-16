import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApi } from "orbs-core-library";

class ConstantTransactionHandlerConfig implements TransactionHandlerConfig {
  private validate: boolean;

  constructor(validate: boolean) {
    this.validate = validate;
  }

  validateSubscription(): boolean {
    return this.validate;
  }
}

export interface PublicApiServiceConfig extends ServiceConfig {
  validateSubscription: boolean;
}

export default class PublicApiService extends Service {
  private publicApi: PublicApi;

  private transactionHandler: TransactionHandler;

  public constructor(virtualMachine: types.VirtualMachineClient, transactionPool: types.TransactionPoolClient, subscriptionManager: types.SubscriptionManagerClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.transactionHandler = new TransactionHandler(transactionPool, subscriptionManager, new ConstantTransactionHandlerConfig((<PublicApiServiceConfig>serviceConfig).validateSubscription));

    this.publicApi = new PublicApi(this.transactionHandler, virtualMachine);
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
  async callContract(rpc: types.CallContractContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${this.config.nodeName}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }
}
