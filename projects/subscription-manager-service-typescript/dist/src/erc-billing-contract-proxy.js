"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const web3 = require("web3");
class ERCBillingContractProxy {
    constructor(sidechainConnectorClient, contractAddress) {
        this.sidechainConnectorClient = sidechainConnectorClient;
        if (!contractAddress) {
            throw "contract Address must not be empty";
        }
        this.contractAddress = contractAddress;
    }
    getSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.sidechainConnectorClient.callEthereumContract({
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
            return { id, tokens: new bignumber_js_1.BigNumber(tokens) };
        });
    }
}
exports.default = ERCBillingContractProxy;
//# sourceMappingURL=erc-billing-contract-proxy.js.map