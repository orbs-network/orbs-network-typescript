import { expect } from "chai";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import KinAtnSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/kinatn-smart-contract";
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

const CONTRACT_ADDRESS = Address.createContractAddress("kin").toBuffer();
const SENDER_ADDRESS = new Address(createHash("sha256").update("sender").digest()).toBase58();
const RECIPIENT_ADDRESS = new Address(createHash("sha256").update("recipient").digest()).toBase58();

// const superuserContract = new KinAtnSmartContract(BarSmartContract.SUPERUSER, adapter);

describe("kin atn contract - transfer tests", () => {
  let adapter: ContractStateMemCacheAccessor;
  let senderContract: KinAtnSmartContract;
  let recipientContract: KinAtnSmartContract;

  beforeEach(() => {
    adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
    senderContract = new KinAtnSmartContract(SENDER_ADDRESS, adapter);
    recipientContract = new KinAtnSmartContract(RECIPIENT_ADDRESS, adapter);
  });

  it("init token balances and transfer tokens", async () => {
    await senderContract.transfer(RECIPIENT_ADDRESS, 1);
    expect(await senderContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE - 1);
    expect(await recipientContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE + 1);
    expect(Number.parseFloat(await adapter.load(KinAtnSmartContract.ALLOCATED_POOL_STATE_VARIABLE))).to.be.equal(KinAtnSmartContract.POOL_INITIAL_VALUE - (2 * KinAtnSmartContract.DEFAULT_BALANCE));
  });

  it("cannot transfer negative amount", async () => {
    await expect(senderContract.transfer(RECIPIENT_ADDRESS, -1)).to.eventually.be.rejectedWith("Transaction amount must be > 0");
  });

  it("can transfer float values", async () => {
    await senderContract.transfer(RECIPIENT_ADDRESS, 1.5);
    expect(await senderContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE - 1.5);
    expect(await recipientContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE + 1.5);
  });

  it("can transfer float values close to zero", async () => {
    const someFloat = 0.00000000001;
    await senderContract.transfer(RECIPIENT_ADDRESS, someFloat);
    expect(await senderContract.getBalance()).to.be.below(KinAtnSmartContract.DEFAULT_BALANCE);
    expect(await recipientContract.getBalance()).to.be.above(KinAtnSmartContract.DEFAULT_BALANCE);
    expect(await senderContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE - someFloat);
    expect(await recipientContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE + someFloat);
  });

  it("allocated pool resets at 0", async () => {
    await adapter.store(KinAtnSmartContract.ALLOCATED_POOL_STATE_VARIABLE, JSON.stringify(KinAtnSmartContract.DEFAULT_BALANCE));
    await senderContract.financeAccount(SENDER_ADDRESS);
    await senderContract.financeAccount(RECIPIENT_ADDRESS);
    expect(Number.parseFloat(await adapter.load(KinAtnSmartContract.ALLOCATED_POOL_STATE_VARIABLE))).to.be.equal(KinAtnSmartContract.POOL_INITIAL_VALUE - KinAtnSmartContract.DEFAULT_BALANCE);
  });

  it("transaction is rejected if account about to overflow", async () => {
    const almostMaxSafeInt = Number.MAX_SAFE_INTEGER - 1;
    await adapter.store(`balances.${RECIPIENT_ADDRESS}`, JSON.stringify(almostMaxSafeInt));
    const toAdd = 2;
    await expect(senderContract.transfer(RECIPIENT_ADDRESS, toAdd)).to.eventually.be.rejectedWith(`Recipient account of ${RECIPIENT_ADDRESS} is at balance ${almostMaxSafeInt} and will overflow if ${toAdd} is added`);
    expect(await recipientContract.getBalance()).to.be.equal(almostMaxSafeInt);
  });
});
