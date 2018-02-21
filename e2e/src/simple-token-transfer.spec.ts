import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";

chai.should();
chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();


async function aFooBarAccountWith(input: { amountOfBars: number }) {
  const senderAddress = `addr_${Math.floor(Math.random() * 100000000)}`; // TODO: replace with a proper public key
  const orbsSession = new OrbsClientSession(senderAddress, testConfig.subscriptionKey, testConfig.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(senderAddress, contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

describe("simple token transfer", async function () {
  this.timeout(800000);
  before(async function () {
    if (testConfig.testEnvironment) {
      console.log("starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });

  it("transfers 1 bar token from one account to another", async function () {

    console.log("initing account1 with 2 bars");
    const account1 = await aFooBarAccountWith({ amountOfBars: 2 });
    await account1.should.have.bars(2);
    console.log("initing account2 with 0 bars");
    const account2 = await aFooBarAccountWith({ amountOfBars: 0 });
    await account2.should.have.bars(0);

    console.log("sending 1 bar from account1 to account2");
    await account1.transfer({ to: account2.address, amountOfBars: 1 });
    await account1.should.to.have.bars(1);
    await account2.should.have.bars(1);

  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
