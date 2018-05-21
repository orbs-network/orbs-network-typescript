import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { ERCBillingContractProxy, Subscription } from "./erc-billing-contract-proxy";

export interface MonthlySubscriptionRateData {
  expiresAt?: number; // timestamp
  rate: number;
}

export interface SubscriptionProfiles {
  [profile: string]: MonthlySubscriptionRateData[];
}

export class SubscriptionManagerConfiguration {
  ethereumContractAddress: string;
  subscriptionProfiles: SubscriptionProfiles;
}

export class SubscriptionManager {
  private contractProxy: ERCBillingContractProxy;
  private config: SubscriptionManagerConfiguration;

  constructor(sidechainConnector: types.SidechainConnectorClient, config: SubscriptionManagerConfiguration) {
    this.config = config;
    this.contractProxy = new ERCBillingContractProxy(sidechainConnector, this.config.ethereumContractAddress);
  }

  async isSubscriptionValid(subscriptionKey: string): Promise<boolean> {
    const subscriptionData =  await this.contractProxy.getSubscriptionData(subscriptionKey);

    const now = new Date();

    const rateData = this.getCurrentSubscriptionRateByProfile(subscriptionData.profile, now);

    if (rateData == undefined) {
      logger.info(`Could not find rate settings for subscription profile ${subscriptionData.profile}`);
      return false;
    }

    const beginningOfThisMonth = new Date(`${now.toISOString().substr(0, 7)}-01`).getTime();

    let minimumRequiredFee: number;

    if (subscriptionData.startTime <= beginningOfThisMonth) {
      minimumRequiredFee = rateData.rate;
    } else {
      const numOfDaysThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endOfThisMonth = new Date(`${now.toISOString().substr(0, 7)}-${numOfDaysThisMonth}`).getTime();

      const subscriptionDurationInMilliseconds = endOfThisMonth - subscriptionData.startTime;
      const numOfMillisecondsThisMonth = endOfThisMonth - beginningOfThisMonth;

      minimumRequiredFee = rateData.rate * (subscriptionDurationInMilliseconds / numOfMillisecondsThisMonth);
    }

    if (subscriptionData.tokens < minimumRequiredFee) {
      logger.info(`Subscription fee is not sufficient (${subscriptionData.tokens} < ${minimumRequiredFee})`);
      return false;
    }

    return true;
  }

  getCurrentSubscriptionRateByProfile(profile: string, date: Date): MonthlySubscriptionRateData {
    const profileRates: MonthlySubscriptionRateData[] = this.config.subscriptionProfiles[profile];
    if (profileRates != undefined) {
      let nonExpiredRates: MonthlySubscriptionRateData[];
      nonExpiredRates = profileRates.filter(rateData => (rateData.expiresAt == undefined) || (rateData.expiresAt > date.getTime()));
      if (nonExpiredRates.length > 0 ) {
        return nonExpiredRates.sort((a, b) => {
          if (a.expiresAt == undefined) {
            return 1; // a >= b
          } else if (b.expiresAt == undefined) {
            return -1; // b >= a
          } else {
            return a.expiresAt - b.expiresAt;
          }
        })[0];
      }
    }
  }
}
