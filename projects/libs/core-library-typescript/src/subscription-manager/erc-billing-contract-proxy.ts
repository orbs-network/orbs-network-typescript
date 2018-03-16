import { BigNumber } from "bignumber.js";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

export interface Subscription {
  id: number;
  tokens: BigNumber;
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

  public async getSubscription(subscriptionKey: string): Promise<Subscription> {
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
          "name": "tokens",
          "type": "uint256"
        }]
      },
      parameters: [subscriptionKey],
    });
    const { id, tokens } = JSON.parse(res.resultJson);
    return { id, tokens: new BigNumber(tokens) };
  }
}
