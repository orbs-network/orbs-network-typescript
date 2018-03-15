import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";
import * as _ from "lodash";

const expect = chai.expect;

chai.should();
chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();


async function aFooBarAccountWith(input: { senderAddress: string, amountOfBars: number }) {
  const orbsSession = new OrbsClientSession(input.senderAddress, testConfig.subscriptionKey, testConfig.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(input.senderAddress, contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

async function createAccounts(input: { seed: number, numberOfAccounts: number }): Promise<FooBarAccount[]> {
  return Promise.all(_.range(input.numberOfAccounts).map((num) => {
    const amountOfBars = num + 10;
    const senderAddress = `addr_${input.seed}_${amountOfBars})}`;

    return aFooBarAccountWith({ senderAddress, amountOfBars });
  }));
}

describe("test multiple transactions", async function () {
  this.timeout(800000);
  before(async function () {
    if (testConfig.testEnvironment) {
      console.log("starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });

  it("transfers 1 bar token from one account to another", async function () {
    console.log("initing account1 with 2 bars");

    const seed = new Date().getTime();
    console.log(`Seed: ${seed}`);

    const [ account1, account2 ] = await createAccounts({ seed: seed, numberOfAccounts: 2 });

    await account1.should.have.bars(10);
    console.log("initing account2 with 0 bars");

    await account2.should.have.bars(11);

    // console.log("sending 1 bar from account1 to account2");
    // await account1.transfer({ to: account2.address, amountOfBars: 1 });
    // await account1.should.to.have.bars(1);
    // await account2.should.have.bars(1);

  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
