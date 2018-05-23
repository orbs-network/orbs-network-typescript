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
