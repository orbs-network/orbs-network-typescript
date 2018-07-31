import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";
import * as _ from "lodash";
import * as crypto from "crypto";
import { delay } from "bluebird";
import { runDockerHealthCheck } from "./docker-health-checks";
const shell = require("shelljs");

const expect = chai.expect;
const DOCKER_HEALTH_CHECK_MAX_RETRIES = 10;
const DOCKER_HEALTH_CHECK_RETRY_INTERVAL_SEC = 10;
const baseAmount: number = 1000;

let accounts: FooBarAccount[];
process.setMaxListeners(0);
chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();
const { API_ENDPOINT } = process.env;
const generateAddress = (keyPair: ED25519Key): Address => {
  const address = new Address(keyPair.publicKey, testConfig.virtualChainId, Address.MAIN_NETWORK_ID);

  return address;
};



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
    const amountOfBars = num + baseAmount;

    return aFooBarAccountWith({ amountOfBars });
  }));
}


async function stress(accounts: FooBarAccount[], attempt: number) {

  await Promise.all(accounts.map(async (account, num) => {
    const isLast = num + 1 === accounts.length;
    const recipient = accounts[isLast ? 0 : num + 1];
    const amount = num + 1;

    console.log(`Sending ${amount} bar from ${account.address} to ${recipient.address}`);
    return account.transfer({ to: recipient.address, amountOfBars: amount });
  }));

  return Promise.all(accounts.map(async (account, num) => {
    const isFirst = num === 0;
    const amount = baseAmount + (isFirst ? accounts.length * (attempt + 1) : num)  - 1  * (attempt + 1);

    console.log(`Account ${account.address} has balance ${await account.getBalance()} (supposed to be ${amount})`);
    return expect(account).to.have.bars(amount);
  }));
}

describe("test multiple transactions", async function () {
  this.timeout(800000000);
  before(async function () {
    if (testConfig.testEnvironment) {
      console.log("Starting test environment...");
      await testConfig.testEnvironment.start();
      try {
        await runDockerHealthCheck(DOCKER_HEALTH_CHECK_MAX_RETRIES, DOCKER_HEALTH_CHECK_RETRY_INTERVAL_SEC);
      } catch (e) {
        console.log(`Error in Docker health check, not all docker containers are not healthy and all retry attempts exhaused`);
        throw e;
      }
    }
  });

  it("transfers tokens between accounts", async function () {
    console.log(`Creating ${testConfig.stressTest.accounts} accounts...`);
    await delay(5000);
    accounts = await createAccounts({ seed: 0, numberOfAccounts: testConfig.stressTest.accounts });
    await Promise.all(accounts.map((account, num) => expect(account).to.have.bars(baseAmount + num)));
    console.log("Created accounts");
    for (const i of _.range(0, Number(process.env.NUM_OF_ATTEMPTS) || 1)) {
      console.log(`Attempt #${i}`);
      await delay(1000);
      try {
        await stress(accounts, i);
        console.log(`Successufully processed transactions between ${testConfig.stressTest.accounts} accounts`);
      } catch (e) {
        console.log(`Failed with error ${e}`);
      }
    }
  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
