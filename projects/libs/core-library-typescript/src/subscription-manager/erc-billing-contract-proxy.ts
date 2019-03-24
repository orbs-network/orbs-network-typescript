/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

export interface Subscription {
  id: number;
  profile: string;
  startTime: number;
  tokens: number;
}

export class ERCBillingContractProxy {
  sidechainConnectorClient: types.SidechainConnectorClient;
  contractAddress: string;

  constructor(sidechainConnectorClient: types.SidechainConnectorClient, contractAddress: string) {
    this.sidechainConnectorClient = sidechainConnectorClient;
    if (!contractAddress) {
      throw new Error("contract Address must not be empty");
    }
    this.contractAddress = contractAddress;
  }

  public async getSubscriptionData(subscriptionKey: string): Promise<Subscription> {
    const res = await this.sidechainConnectorClient.callEthereumContract({
      contractAddress: this.contractAddress,
      functionInterface: {
        name: "getSubscriptionData",
        inputs: [
          { name: "_id", type: "bytes32" }
        ],
        outputs: [{
          "name": "id",
          "type": "bytes32",
        }, {
          "name": "profile",
          "type": "string",
        }, {
          "name": "startTime",
          "type": "uint256"
        },
        {
          "name": "tokens",
          "type": "uint256"
        }]
      },
      parameters: [subscriptionKey],
    });
    const { id, profile, startTime, tokens } = JSON.parse(res.resultJson);
    return { id, profile, startTime: Number.parseInt(startTime), tokens: Number.parseInt(tokens) };
  }
}
