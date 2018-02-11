import { types, logger } from "orbs-common-library";
import { BigNumber } from "bignumber.js";

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
            throw "contract Address must not be empty";
        }
        this.contractAddress = contractAddress;
    }

    public async getSubscription(subscriptionId: string): Promise<Subscription> {
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
            parameters: [subscriptionId],
        });
        const { id, tokens } = JSON.parse(res.resultJson);
        return { id, tokens: new BigNumber(tokens) };
    }
}
