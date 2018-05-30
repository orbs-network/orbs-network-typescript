import bind from "bind-decorator";

import { types, logger, StartupCheck, StartupStatus, STARTUP_STATUS } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { SubscriptionManager } from "orbs-core-library";

export default class SubscriptionManagerService extends Service implements StartupCheck {
  private SERVICE_NAME = "subscription-manager";
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

  public async startupCheck(): Promise<StartupStatus> {
    if (!this.subscriptionManager) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing subscriptionManager" };
    }
    return { name: this.SERVICE_NAME, status: STARTUP_STATUS.OK };
  }

}
