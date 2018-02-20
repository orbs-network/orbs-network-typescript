import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { SubscriptionManager } from "orbs-core-library";

export default class SubscriptionManagerService extends Service {
  private subscriptionManager: SubscriptionManager;

  private sidechainConnector: types.SidechainConnectorClient;

  public constructor(sidechainConnector: types.SidechainConnectorClient, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.sidechainConnector = sidechainConnector;
  }

  async initialize() {
    await this.initSubscriptionManager();

  }

  async initSubscriptionManager(): Promise<void> {
    const subscriptionManagerConfiguration = { ethereumContractAddress: config.get("ethereumContractAddress") };

    if (!subscriptionManagerConfiguration.ethereumContractAddress) {
      logger.error("ethereumContractAddress wasn't provided! SubscriptionManager is disabled!");

      return;
    }

    this.subscriptionManager = new SubscriptionManager(this.sidechainConnector, subscriptionManagerConfiguration);
  }

  @Service.RPCMethod
  async getSubscriptionStatus(rpc: types.GetSubscriptionStatusContext) {
    const { id, tokens } = await this.subscriptionManager.getSubscriptionStatus(rpc.req.subscriptionKey);
    rpc.res = { active: tokens.isGreaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000 };
  }
}
