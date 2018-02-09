import { logger, types } from "orbs-common-library";

import { ERCBillingContractProxy } from "./erc-billing-contract-proxy";

export class SusbcriptionManagerConfiguration {
  ethereumContractAddress: string;
}

export class SusbcriptionManager {
  private contractProxy: ERCBillingContractProxy;
  private config: SusbcriptionManagerConfiguration;

  constructor(config: SusbcriptionManagerConfiguration) {
    this.config = config;
  }

  async getSubscriptionStatus(subscriptionKey: string) {
    const { id, tokens } = await this.contractProxy.getSubscription(subscriptionKey);

    return { active: tokens.isGreaterThan(0), expiryTimestamp: Date.now() + 24 * 60 * 1000 };
  }
}
