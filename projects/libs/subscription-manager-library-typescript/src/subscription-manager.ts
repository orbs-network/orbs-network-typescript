import { logger, types } from "orbs-common-library";

import { ERCBillingContractProxy } from "./erc-billing-contract-proxy";

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
    const { id, tokens } = await this.contractProxy.getSubscription(subscriptionKey);

    return { active: tokens.isGreaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000 };
  }
}
