import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { ERCBillingContractProxy, Subscription } from "./erc-billing-contract-proxy";

export class SubscriptionManagerConfiguration {
  ethereumContractAddress: string;
}

export class SubscriptionManager {
  private contractProxy: ERCBillingContractProxy;
  private config: SubscriptionManagerConfiguration;

  constructor(config: SubscriptionManagerConfiguration) {
    this.config = config;
  }

  async getSubscriptionStatus(subscriptionKey: string) {
    return await this.contractProxy.getSubscription(subscriptionKey);
  }
}
