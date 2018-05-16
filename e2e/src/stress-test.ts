import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";
import * as _ from "lodash";
import * as crypto from "crypto";

const expect = chai.expect;

chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();
const { API_ENDPOINT } = process.env;

async function aFooBarAccountWith(input: { keyPair: ED25519Key, amountOfBars: number }) {
  const senderAddress = new Address(input.keyPair.publicKey, testConfig.virtualChainId, Address.TEST_NETWORK_ID);
  const orbsClient = new OrbsClient(API_ENDPOINT, senderAddress, input.keyPair);
  const contractAdapter = new OrbsContract(orbsClient, "foobar");
  const account = new FooBarAccount(senderAddress.toString(), contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

async function createAccounts(input: { seed: number, numberOfAccounts: number }): Promise<FooBarAccount[]> {
  return Promise.all(_.range(input.numberOfAccounts).map((num) => {
    const amountOfBars = num + 10;
    const keyPair = new ED25519Key();
    return aFooBarAccountWith({ keyPair, amountOfBars });
  }));
}

describe("test multiple transactions", async function () {
  this.timeout(800000);
  before(async function () {
    if (testConfig.testEnvironment) {
      console.log("Starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });

  it("transfers tokens between accounts", async function () {
    console.log("Creating accounts...");

    const seed = new Date().getTime();
    console.log(`Seed: ${seed}`);

    const accounts = await createAccounts({ seed: seed, numberOfAccounts: testConfig.stressTest.accounts });

    await Promise.all(accounts.map((account, num) => expect(account).to.have.bars(10 + num)));

    await Promise.all(accounts.map((account, num) => {
      const isLast = num + 1 === testConfig.stressTest.accounts;
      const recipient = accounts[isLast ? 0 : num + 1];
      const amount = num + 1;

      console.log(`Sending ${amount} bar from ${account.address} to ${recipient.address}`);

      return account.transfer({ to: recipient.address, amountOfBars: amount });
    }));

    await Promise.all(accounts.map(async (account, num) => {
      console.log(`Account ${account.address} has balance ${await account.getBalance()}`);
      const isFirst = num === 0;
      const amount = 10 + (isFirst ? testConfig.stressTest.accounts : num) - 1;

      return expect(account).to.have.bars(amount);
    }));
  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
