import { Assertion, expect } from "chai";
import { CryptoUtils } from "orbs-common-library/src/cryptoUtils";
import { grpc } from "orbs-common-library/src/grpc";
import { types } from "orbs-common-library/src/types";
import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-contract";
import { OrbsTopology } from "./topology";
import { delay } from "bluebird";

const accounts = new Map<string, FooBarAccount>();

async function assertFooBarAccountBalance (n: number) {
    // make sure we are working with am Account model
    new Assertion(this._obj).to.be.instanceof(FooBarAccount);

    const account = <FooBarAccount>this._obj;

    const actualBars = await account.getBalance();

    this.assert(
        actualBars === n
        , "expected #{this} to have balance #{exp} but got #{act}"
        , "expected #{this} to not have balance #{act}"
        , n
        , actualBars
    );
}

Assertion.addMethod("bars", assertFooBarAccountBalance);

const topology = OrbsTopology.loadFromPath("../../config/topologies/transaction-gossip");
const publicApiClient = topology.nodes[1].getPublicApiClient();

async function aFooBarAccountWith(input: {amountOfBars: number}) {
    const orbsKeyPair: CryptoUtils = CryptoUtils.initializeTestCrypto(`user${Math.floor((Math.random() * 10) + 1)}`);

    const orbsSession = new OrbsClientSession(orbsKeyPair, "fooFoundation", publicApiClient);
    const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
    const account = new FooBarAccount(orbsKeyPair.getPublicKey(), contractAdapter);

    accounts.set(account.address, account);

    await account.initBalance(input.amountOfBars);

    return account;
}

async function cleanup(success: boolean) {
    topology.stopAll();
    await delay(10000);
    // hack for terminating CI Alpine docker
    process.exit(success ? 0 : -1);
}

describe("simple token transfer", async function() {
    this.timeout(100000);
    before(async function() {
        await topology.startAll();
    });

    it("transfers 1 bar token from one account to another", async function() {

        console.log("initing account1 with 2 bars");
        const account1 = await aFooBarAccountWith({amountOfBars: 2});
        await expect(account1).to.have.bars(2);
        console.log("initing account2 with 0 bars");
        const account2 = await aFooBarAccountWith({amountOfBars: 0});
        await expect(account2).to.have.bars(0);

        console.log("sending 1 bar from account1 to account2");
        await account1.transfer({to: account2.address, amountOfBars: 1});
        await expect(account1).to.have.bars(1);
        await expect(account2).to.have.bars(1);

    });

    afterEach(async function() {
        if (this.currentTest.state != "passed") {
            await cleanup(false);
        }
    });

    after(async () => {
        await cleanup(true);
    });
});
