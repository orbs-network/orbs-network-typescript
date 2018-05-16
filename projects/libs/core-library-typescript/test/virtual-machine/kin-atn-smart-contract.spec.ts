import { expect } from "chai";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import KinAtnSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/kin-smart-contract";
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
const adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
const senderContract = new KinAtnSmartContract(SENDER_ADDRESS, adapter);
const recipientContract = new KinAtnSmartContract(RECIPIENT_ADDRESS, adapter);
// const superuserContract = new KinAtnSmartContract(BarSmartContract.SUPERUSER, adapter);

describe("kin atn contract - transfer tests", () => {
  it("init token balances and transfer tokens", async () => {
    await senderContract.transfer(RECIPIENT_ADDRESS, 1);
    expect(await senderContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE - 1);
    expect(await recipientContract.getBalance()).to.be.equal(KinAtnSmartContract.DEFAULT_BALANCE + 1);
    expect(Number.parseFloat(await adapter.load(`balances.${KinAtnSmartContract.ALLOCATED_ACCOUNT_NAME}`))).to.be.equal(KinAtnSmartContract.POOL_INITIAL_VALUE - (2 * KinAtnSmartContract.DEFAULT_BALANCE));
  });

  it("cannot transfer negative amount", async () => {
    await expect(senderContract.transfer(RECIPIENT_ADDRESS, -1)).to.eventually.be.rejectedWith("Transaction amount must be > 0");
  });
});
