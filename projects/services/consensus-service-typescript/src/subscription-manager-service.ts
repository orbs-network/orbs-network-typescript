import bind from "bind-decorator";

import { types, logger } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { SubscriptionManager } from "orbs-core-library";

export default class SubscriptionManagerService extends Service {
  private subscriptionManager: SubscriptionManager;

  public constructor(subscriptionManager: SubscriptionManager, serviceConfig: ServiceConfig) {
    super(serviceConfig);
    this.subscriptionManager = subscriptionManager;
  }

  async initialize() {
  }

  async shutdown() {

  }

  @Service.RPCMethod
  async isSubscriptionValid(rpc: types.IsSubscriptionValidContext) {
    const isValid = await this.subscriptionManager.isSubscriptionValid(rpc.req.subscriptionKey);
    rpc.res = { isValid };
  }
}
