import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { ERCBillingContractProxy, Subscription } from "./erc-billing-contract-proxy";

export class SubscriptionManagerConfiguration {
  ethereumContractAddress: string;
}

export class SubscriptionManager {
  private contractProxy: ERCBillingContractProxy;
  private config: SubscriptionManagerConfiguration;

  constructor(sidechainConnector: types.SidechainConnectorClient, config: SubscriptionManagerConfiguration) {
    this.config = config;
    this.contractProxy = new ERCBillingContractProxy(sidechainConnector, this.config.ethereumContractAddress);
  }

  async getSubscriptionStatus(subscriptionKey: string) {
    return await this.contractProxy.getSubscription(subscriptionKey);
  }
}
