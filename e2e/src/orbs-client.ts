import { types } from "orbs-common-library/src/types";
import { CryptoUtils } from "orbs-common-library/src/CryptoUtils";
import { grpc } from "orbs-common-library/src/grpc";
import { delay } from "bluebird";


type OrbsHardCodedContractMethodArgs = [string | number] | undefined[];

export class OrbsHardCodedContractAdapter {
    orbsSession: OrbsClientSession;
    contractAddress: string;

    constructor(orbsSession: OrbsClientSession, contractAddress: string) {
        this.orbsSession = orbsSession;
        this.contractAddress = contractAddress;
    }

    public async sendTransaction(methodName: string, args: OrbsHardCodedContractMethodArgs) {
        const argumentsJson = JSON.stringify({
            method: methodName,
            args: args
        });
        return await this.orbsSession.sendTransaction(this.contractAddress, argumentsJson);
    }

    public async call(methodName: string, args: OrbsHardCodedContractMethodArgs) {
        const argumentsJson = JSON.stringify({
            method: methodName,
            args: args
        });
        return this.orbsSession.call(this.contractAddress, argumentsJson);
    }
}

export class OrbsClientSession {
    keyPair: CryptoUtils;
    orbsClient: types.PublicApiClient;
    subscriptionKey: string;

    constructor(keyPair: CryptoUtils, subscriptionKey: string, orbsClient: types.PublicApiClient) {
        this.keyPair = keyPair;
        this.orbsClient = orbsClient;
        this.subscriptionKey = subscriptionKey;
    }

    async sendTransaction(contractAddress: string, argumentsJson: string) {
        const signedTransaction = this.generateSignedTransaction(contractAddress, argumentsJson);

        const res = await this.orbsClient.sendTransaction({
            transaction: signedTransaction,
            transactionAppendix: {
                prefetchAddresses: [],
                subscriptionKey: this.subscriptionKey
            }
        });
        await delay(10000);
        return res;
    }

    async call(contractAddress: string, argumentsJson: string) {
        const {resultJson} = await this.orbsClient.call({
            sender: this.getAddress(),
            contractAddress: contractAddress,
            argumentsJson: argumentsJson
        });
        return JSON.parse(resultJson);
    }

    public generateSignedTransaction(contractAddress: string, argumentsJson: string): types.Transaction {
        return {
            sender: this.keyPair.getPublicKey(),
            contractAddress: contractAddress,
            argumentsJson: argumentsJson,
            signature: this.keyPair.sign(`tx:${contractAddress},${argumentsJson}`)
        };
    }

    public getAddress() {
        return this.keyPair.getPublicKey();
    }
}
