const { Assertion, expect } = require("chai");
import * as nconf from "nconf";


import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-contract";
import { TestEnvironment } from "./test-environment";
import { PublicApiClient, initPublicApiClient } from "./public-api-client";


let testEnvironment: TestEnvironment;
let publicApiClient: PublicApiClient;

nconf.env({ parseValues: true });

if (nconf.get("E2E_NO_DEPLOY")) {
  const publicApiEndpoint = nconf.get("E2E_PUBLIC_API_ENDPOINT");
  if (!publicApiEndpoint) {
    throw new Error("E2E_PUBLIC_API_ENDPOINT must be defined in a no-deploy configuration");
  }

  publicApiClient = initPublicApiClient({ endpoint: process.env.E2E_PUBLIC_API_ENDPOINT });
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
  const senderAddress = `addr_${Math.floor(Math.random() * 100000000)}`; // TODO: replace with a proper public key
  const orbsSession = new OrbsClientSession(senderAddress, "fooFoundation", publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(senderAddress, contractAdapter);

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
