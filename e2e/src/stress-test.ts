import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";
import * as _ from "lodash";
import * as crypto from "crypto";
import { delay } from "bluebird";

const expect = chai.expect;

chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();
const { API_ENDPOINT } = process.env;
const generateAddress = (keyPair: ED25519Key): Address => {
  const address = new Address(keyPair.publicKey, testConfig.virtualChainId, Address.TEST_NETWORK_ID);

  return address;
};

export function generateKey(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}


async function aFooBarAccountWith(input: { amountOfBars: number }) {
  const prebuiltKeyPair = new ED25519Key();

  const keyPair = new ED25519Key(prebuiltKeyPair.publicKey, prebuiltKeyPair.getPrivateKeyUnsafe());
  const senderAddress = generateAddress(keyPair);
  const orbsClient = new OrbsClient(testConfig.apiEndpoint, senderAddress, keyPair);
  const contractAdapter = new OrbsContract(orbsClient, "foobar");
  const account = new FooBarAccount(senderAddress.toString(), contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

async function createAccounts(input: { seed: number, numberOfAccounts: number }): Promise<FooBarAccount[]> {
  return Promise.all(_.range(input.numberOfAccounts).map((num) => {
    const amountOfBars = num + 10;

    return aFooBarAccountWith({ amountOfBars });
  }));
}

async function stress(numberOfAccounts: number, seed: number) {
  console.log("Creating accounts...");

  // const seed = new Date().getTime();
  console.log(`Seed: ${seed}`);

  const accounts = await createAccounts({ seed: seed, numberOfAccounts });

  await Promise.all(accounts.map((account, num) => expect(account).to.have.bars(10 + num)));

  await delay(1000);

  await Promise.all(accounts.map((account, num) => {
    const isLast = num + 1 === testConfig.stressTest.accounts;
    const recipient = accounts[isLast ? 0 : num + 1];
    const amount = num + 1;

    console.log(`Sending ${amount} bar from ${account.address} to ${recipient.address}`);

    return account.transfer({ to: recipient.address, amountOfBars: amount });
  }));

  return Promise.all(accounts.map(async (account, num) => {
    const isFirst = num === 0;
    const amount = 10 + (isFirst ? testConfig.stressTest.accounts : num) - 1;

    console.log(`Account ${account.address} has balance ${await account.getBalance()} (supposed to be ${amount})`);

    return expect(account).to.have.bars(amount);
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
    for (const i of _.range(0, Number(process.env.NUM_OF_ATTEMPTS) || 1)) {
      console.log(`Attempt #${i}`);
      await delay(1000);
      try {
        await stress(testConfig.stressTest.accounts, i);
        console.log(`Successufully processed transactions between ${testConfig.stressTest.accounts} accounts`);
      } catch (e) {
        console.log(`Failed with error ${e}`);
      }

      // try {
      //   await stress(100);
      // } catch (e) {
      //   console.log(`Expected to fail to create a block of 100 accounts/transactions`);
      // }

      // await delay(1000);
    }
  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
