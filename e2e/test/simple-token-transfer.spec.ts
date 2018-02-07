import { Assertion, expect } from "chai";
import * as nconf from "nconf";

import { CryptoUtils } from "orbs-common-library/src/cryptoUtils";
import { grpc } from "orbs-common-library/src/grpc";
import { types } from "orbs-common-library/src/types";

import { OrbsClientSession, OrbsHardCodedContractAdapter } from "../src/orbs-client";
import { FooBarAccount } from "../src/foobar-contract";
import { OrbsTopology } from "../src/topology";

class TestEnvironment {
    topology: OrbsTopology;

    constructor() {
        this.topology = OrbsTopology.loadFromPath("../../config/topologies/transaction-gossip");
    }

    async start() {
        await this.topology.startAll();
    }

    async stop() {
        await this.topology.stopAll();
    }

    getPublicApiClient() {
        return this.topology.nodes[1].getPublicApiClient();
    }
}

let publicApiClient: types.PublicApiClient;
let testEnvironment: TestEnvironment;

nconf.env({ parseValues: true });

if (nconf.get("E2E_NO_DEPLOY")) {
    const publicApiEndpoint = nconf.get("E2E_PUBLIC_API_ENDPOINT");
    if (!publicApiEndpoint)
        throw "E2E_PUBLIC_API_ENDPOINT must be defined in a no-deploy configuration";

    publicApiClient = grpc.publicApiClient({ endpoint: process.env.E2E_PUBLIC_API_ENDPOINT });
} else {
    testEnvironment = new TestEnvironment();
    publicApiClient = testEnvironment.getPublicApiClient();
}

async function assertFooBarAccountBalance(n: number) {
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

async function aFooBarAccountWith(input: { amountOfBars: number }) {
    const orbsKeyPair: CryptoUtils = CryptoUtils.initializeTestCrypto(`user${Math.floor((Math.random() * 10) + 1)}`);

    const orbsSession = new OrbsClientSession(orbsKeyPair, "fooFoundation", publicApiClient);
    const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
    const account = new FooBarAccount(orbsKeyPair.getPublicKey(), contractAdapter);

    await account.initBalance(input.amountOfBars);

    return account;
}

describe("simple token transfer", async function () {
    this.timeout(100000);
    before(async function () {
        if (testEnvironment) {
            console.log("starting the test environment");
            await testEnvironment.start();
        }
    });

    it("transfers 1 bar token from one account to another", async function () {

        console.log("initing account1 with 2 bars");
        const account1 = await aFooBarAccountWith({ amountOfBars: 2 });
        await expect(account1).to.have.bars(2);
        console.log("initing account2 with 0 bars");
        const account2 = await aFooBarAccountWith({ amountOfBars: 0 });
        await expect(account2).to.have.bars(0);

        console.log("sending 1 bar from account1 to account2");
        await account1.transfer({ to: account2.address, amountOfBars: 1 });
        await expect(account1).to.have.bars(1);
        await expect(account2).to.have.bars(1);

    });

    after(async function () {
        if (testEnvironment) {
            await testEnvironment.stop();
        }
    });
});
