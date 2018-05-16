import * as chai from "chai";
import * as _ from "lodash";
import * as crypto from "crypto";

import { OrbsClient, OrbsContract, Address, ED25519Key } from "orbs-client-sdk";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import ChaiBarsPlugin from "./chai-bars-plugin";

const expect = chai.expect;

chai.should();
chai.use(ChaiBarsPlugin);

const generateAddress = (keyPair: ED25519Key): Address => {
  const address = new Address(keyPair.publicKey, testConfig.virtualChainId, Address.TEST_NETWORK_ID);

  return address;
};

const testConfig = loadDefaultTestConfig();

async function aFooBarAccountWith(input: { amountOfBars: number }) {
  const keyPair = new ED25519Key();
  const senderAddress = generateAddress(keyPair);
  const orbsClient = new OrbsClient(testConfig.apiEndpoint, senderAddress, keyPair);
  const contractAdapter = new OrbsContract(orbsClient, "foobar");
  const account = new FooBarAccount(senderAddress.toString(), contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

async function aTextMessageAccount() {
  const keyPair = new ED25519Key();
  const senderAddress = generateAddress(keyPair);
  const orbsClient = new OrbsClient(testConfig.apiEndpoint, senderAddress, keyPair);
  const contractAdapter = new OrbsContract(orbsClient, "text-message");
  const account = new TextMessageAccount(senderAddress.toString(), contractAdapter);

  return account;
}

describe("simple token transfer", async function () {
  this.timeout(800000);

  before(async () => {
    if (testConfig.testEnvironment) {
      console.log("starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });

  it("transfers 1 bar token from one account to another", async () => {
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
});

describe("simple message", async function () {
  this.timeout(800000);

  before(async () => {
    if (testConfig.testEnvironment) {
      console.log("starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });


  it("sends text messages between accounts", async () => {
    console.log("Initiating account for Alice");
    const alice = await aTextMessageAccount();

    console.log("Initiating account for Bob");
    const bob = await aTextMessageAccount();

    console.log("Sending messages from Alice to Bob and from Bob to Alice");

    await alice.sendMessage(bob.address, "hello");
    await alice.sendMessage(bob.address, "sup");
    await bob.sendMessage(alice.address, "is anybody in here?");

    const [bobMessages, aliceMessages] = await Promise.all([bob.getMyMessages(), alice.getMyMessages()]);
    const [bobMessage1, bobMessage2] = _.sortBy(bobMessages, "timestamp");

    expect(bobMessages.length).to.equal(2);
    expect(bobMessage1.message).to.equal("hello");
    expect(bobMessage2.message).to.equal("sup");

    expect(aliceMessages.length).to.equal(1);
    expect(aliceMessages[0].message).to.equal("is anybody in here?");
  });



  after(async () => {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
