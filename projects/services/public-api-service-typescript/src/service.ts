import * as _ from "lodash";

import { logger, config, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { TransactionHandler, TransactionHandlerConfig } from "orbs-core-library";
import { PublicApi } from "orbs-core-library";

class ConstantTransactionHandlerConfig implements TransactionHandlerConfig {
  validateSubscription(): boolean {
    return false;
  }
}

export default class PublicApiService extends Service {
  private publicApi: PublicApi;

  private virtualMachine: types.VirtualMachineClient;
  private consensus: types.ConsensusClient;
  private subscriptionManager: types.SubscriptionManagerClient;
  private transactionHandler: TransactionHandler;

  async initialize() {
    this.virtualMachine = this.peers.virtualMachine;
    this.consensus = this.peers.consensus;
    this.subscriptionManager = this.peers.subscriptionManager;

    this.publicApi = new PublicApi(this.transactionHandler, this.virtualMachine);
    this.transactionHandler = new TransactionHandler(this.consensus, this.subscriptionManager,
      new ConstantTransactionHandlerConfig());

    this.askForHeartbeats([this.consensus, this.virtualMachine]);
  }

  @Service.RPCMethod
  async sendTransaction(rpc: types.SendTransactionContext) {
    await this.publicApi.sendTransaction(rpc.req);
  }

  @Service.RPCMethod
  async call(rpc: types.CallContext) {
    const resultJson = await this.publicApi.callContract(rpc.req);

    logger.debug(`${this.nodeTopology.name}: called contract with ${JSON.stringify(rpc.req)}. result is: ${resultJson}`);

    rpc.res = {
      resultJson: resultJson
    };
  }
}
