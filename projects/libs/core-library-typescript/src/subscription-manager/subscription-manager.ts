/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { ERCBillingContractProxy, Subscription } from "./erc-billing-contract-proxy";
import * as cache from "memory-cache";

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
  private subscriptionCache: cache.CacheClass<string, Subscription>;
  private readonly CACHE_TIMEOUT_IN_MS: number = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(sidechainConnector: types.SidechainConnectorClient, config: SubscriptionManagerConfiguration) {
    this.config = config;
    this.contractProxy = new ERCBillingContractProxy(sidechainConnector, this.config.ethereumContractAddress);
    this.subscriptionCache = new cache.Cache();
  }

  async isSubscriptionValid(subscriptionKey: string): Promise<boolean> {
    let subscriptionData = this.subscriptionCache.get(subscriptionKey);
    if (subscriptionData == undefined) {
      subscriptionData =  await this.contractProxy.getSubscriptionData(subscriptionKey);
      this.subscriptionCache.put(subscriptionKey, subscriptionData, this.CACHE_TIMEOUT_IN_MS);
    }
    else {
      logger.debug(`Subscription ${subscriptionKey} loaded from cache`);
    }

    const now = new Date();

    const rateData = this.getCurrentSubscriptionRateByProfile(subscriptionData.profile, now);

    if (rateData == undefined) {
      logger.info(`Could not find rate settings for subscription profile ${subscriptionData.profile}`);
      return false;
    }

    const beginningOfThisMonth = new Date(`${now.toISOString().substr(0, 7)}-01`).getTime();

    let minimumRequiredFee: number;

    if (subscriptionData.startTime >= new Date().getTime()) {
      logger.info(`Subscription startTime is in the future: ${JSON.stringify(subscriptionData)}`);
      return false;
    }

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
      logger.info(`Subscription fee is insufficient (${subscriptionData.tokens} < ${minimumRequiredFee})`);
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
