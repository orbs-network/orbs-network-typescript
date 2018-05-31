import { expect } from "chai";
import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import EventCounterContract from "../../src/virtual-machine/hard-coded-contracts/registry/event-counter-smart-contract";
import BaseSmartContract from "../../src/virtual-machine/hard-coded-contracts/base-smart-contact";
import { types } from "../../src";
import { Address } from "../../src/common-library/address";
import { createHash } from "crypto";

chai.use(chaiAsPromised);

export default class ContractStateMemCacheAccessor extends BaseContractStateAccessor {
  lastBlockId: number;
  stateCache: StateCache;

  constructor(contractAddress: Buffer, stateCache: StateCache) {
    super(contractAddress);

    this.stateCache = stateCache;
  }

  async load(key: string) {
    return this.stateCache.get({ contractAddress: this.contractAddress, key });
  }

  async store(key: string, value: string) {
    this.stateCache.set({ contractAddress: this.contractAddress, key }, value);
  }
}

const CONTRACT_ADDRESS = Address.createContractAddress("event-counter-contract").toBuffer();
const ALICE_ADDRESS = new Address(createHash("sha256").update("Alice").digest()).toBase58();
const BOB_ADDRESS = new Address(createHash("sha256").update("Bob").digest()).toBase58();

let adapter: BaseContractStateAccessor;
let aliceContract: BaseSmartContract;
let bobContract: BaseSmartContract;

describe("event counter contract ", () => {
  beforeEach(() => {
    adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
    aliceContract = new EventCounterContract(ALICE_ADDRESS, adapter);
    bobContract = new EventCounterContract(BOB_ADDRESS, adapter);
  });


  it("updates the counter for an account", async () => {
    await aliceContract.reportEvent("hello");
    await aliceContract.reportEvent("hello");
    await bobContract.reportEvent("hello");
    await bobContract.reportEvent("bye");

    await expect(await aliceContract.getCounter("hello")).to.be.eql(2);
    await expect(await aliceContract.getCounter("event-that-never-happened")).to.be.eql(0);
    await expect(await bobContract.getCounter("hello")).to.be.eql(1);
    await expect(await bobContract.getCounter("bye")).to.be.eql(1);
  });

  it("returns 0 for accounts that have no records", async () => {
    await expect(await aliceContract.getCounter("hello")).to.be.eql(0);
  });

  it("throws validation error if argument is not a string", async () => {
    await aliceContract.reportEvent("hello");

    return expect(aliceContract.reportEvent(1)).to.be.rejectedWith("Argument event must be a string");
  });
});
