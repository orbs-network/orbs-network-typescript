const {Assertion, expect} = require("chai");
import { grpc } from "orbs-common-library/src/grpc";
import { types } from "orbs-common-library/src/types";
import { CryptoUtils } from "orbs-common-library/src/CryptoUtils";
import { delay } from "bluebird";


const accounts = new Map<string, Account>();

type contractMethodArgs = [string | number] | undefined[];

class HardCodedContactClient {
    orbsClient: OrbsClient;

    constructor(orbsClient: OrbsClient) {
        this.orbsClient = orbsClient;
    }

    protected async sendTransaction(methodName: string, args: contractMethodArgs) {
        const argumentsJson = JSON.stringify({
            method: methodName,
            args: args
        });
        return this.orbsClient.sendTransaction(BarContractClient.BAR_CONTRACT_ADDRESS, argumentsJson);
    }

    protected async call(methodName: string, args: contractMethodArgs) {
        const argumentsJson = JSON.stringify({
            method: methodName,
            args: args
        });
        return this.orbsClient.call(BarContractClient.BAR_CONTRACT_ADDRESS, argumentsJson);
    }
}

class BarContractClient extends HardCodedContactClient {
    static BAR_CONTRACT_ADDRESS = "barbar";

    public initBalance(account: string, balance: number) {
        return this.sendTransaction("initBalance", [account, balance]);
    }

    public transfer(to: string, amount: number) {
        return this.sendTransaction("transfer", [to, amount]);
    }

    public getMyBalance() {
        return this.call("getMyBalance", []);
    }
}

class OrbsClient {
    crypto: CryptoUtils;
    publicApiClient: types.PublicApiClient;

    constructor(crypto: CryptoUtils, endpointAddress: string = "0.0.0.0:51251") {
        this.crypto = crypto;
        this.publicApiClient = grpc.publicApiClient({endpoint: endpointAddress});
    }

    async sendTransaction(contractAddress: string, argumentsJson: string) {
        const signedTransaction = this.generateSignedTransaction(contractAddress, argumentsJson);

        return await this.publicApiClient.sendTransaction({
            transaction: signedTransaction,
            transactionAppendix: {prefetchAddresses: []}
        });
    }

    async call(contractAddress: string, argumentsJson: string) {
        const {resultJson} = await this.publicApiClient.call({
            sender: this.getAddress(),
            contractAddress: contractAddress,
            argumentsJson: argumentsJson
        });
        return JSON.parse(resultJson);
    }

    public generateSignedTransaction(contractAddress: string, argumentsJson: string): types.Transaction {
        return {
            sender: this.crypto.getPublicKey(),
            contractAddress: contractAddress,
            argumentsJson: argumentsJson,
            signature: this.crypto.sign(`tx:${contractAddress},${argumentsJson}`)
        };
    }

    public getAddress() {
        return this.crypto.getPublicKey();
    }
}

class Account {
    crypto: CryptoUtils;
    barContractClient: BarContractClient;

    constructor(crypto: CryptoUtils) {
        this.crypto = crypto;
        this.barContractClient = new BarContractClient(new OrbsClient(crypto));
    }

    public async initBarBalance(bars: number) {
        return this.barContractClient.initBalance(this.getAddress(), bars);
    }

    public async sendBars(transaction: {to: string, bars: number}) {
        this.barContractClient.transfer(transaction.to, transaction.bars);
    }

    public async getAmountOfBars(): Promise<number> {
        return this.barContractClient.getMyBalance();
    }

    public getAddress() {
        return this.crypto.getPublicKey();
    }

}


async function assertModelBars (n: number) {
    // make sure we are working with am Account model
    new Assertion(this._obj).to.be.instanceof(Account);

    const account = <Account>this._obj;

    const actualBars = await account.getAmountOfBars();

    this.assert(
        actualBars === n
        , "expected #{this} to have balance #{exp} but got #{act}"
        , "expected #{this} to not have balance #{act}"
        , n
        , actualBars
    );
}

Assertion.addMethod("bars", assertModelBars);


async function anAccountWith(input: {bars: number}) {
    const accountCrypto: CryptoUtils = CryptoUtils.initializeTestCrypto(`user${Math.floor((Math.random() * 10) + 1)}`);
    const account = new Account(accountCrypto);

    accounts.set(account.getAddress(), account);

    if (input.bars > 0)
        await account.initBarBalance(input.bars);

    return account;
}

describe("simple token transfer", function() {
    this.timeout(400000);
    it("transfers 1 token from one account to another", async function() {
        this.timeout(400000);

        console.log("initing account1 with 2 bars");
        const account1 = await anAccountWith({bars: 2});
        console.log("initing account2 with 0 bars");
        const account2 = await anAccountWith({bars: 0});
        await delay(5000);
        await expect(account1).to.have.bars(2);
        await expect(account2).to.have.bars(0);

        console.log("sending 1 bar from account1 to account2");
        await account1.sendBars({to: account2.getAddress(), bars: 1});
        await delay(5000);
        await expect(account1).to.have.bars(1);
        await expect(account2).to.have.bars(1);
    });
});