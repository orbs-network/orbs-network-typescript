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
        const payload = JSON.stringify({
            method: methodName,
            args: args
        });
        return await this.orbsSession.sendTransaction(this.contractAddress, payload);
    }

    public async call(methodName: string, args: OrbsHardCodedContractMethodArgs) {
        const payload = JSON.stringify({
            method: methodName,
            args: args
        });
        return this.orbsSession.call(this.contractAddress, payload);
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

    async sendTransaction(contractAddress: string, payload: string) {
        const signedTransaction = this.generateSignedTransaction(contractAddress, payload);

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

    async call(contractAddress: string, payload: string) {
        const {resultJson} = await this.orbsClient.call({
            sender: this.getAddress(),
            contractAddress: contractAddress,
            payload: payload
        });
        return JSON.parse(resultJson);
    }

    public generateSignedTransaction(contractAddress: string, payload: string): types.Transaction {
        return {
            sender: this.keyPair.getPublicKey(),
            contractAddress: contractAddress,
            payload: payload,
            signature: this.keyPair.sign(`tx:${contractAddress},${payload}`)
        };
    }

    public getAddress() {
        return this.keyPair.getPublicKey();
    }
}
