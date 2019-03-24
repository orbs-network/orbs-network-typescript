/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { expect } from "chai";
import "mocha";

import { StateCache } from "../../src/virtual-machine/state-cache";
import { BaseContractStateAccessor } from "../../src/virtual-machine/contract-state-accessor";
import BarSmartContract from "../../src/virtual-machine/hard-coded-contracts/registry/foobar-smart-contract";
import BaseSmartContract from "../../src/virtual-machine/hard-coded-contracts/base-smart-contact";
import { types } from "../../src";
import { Address } from "../../src/common-library/address";
import { createHash } from "crypto";

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

const CONTRACT_ADDRESS = Address.createContractAddress("foobar").toBuffer();
const SENDER_ADDRESS = new Address(createHash("sha256").update("sender").digest()).toBase58();
const RECIPIENT_ADDRESS = new Address(createHash("sha256").update("recipient").digest()).toBase58();
const adapter = new ContractStateMemCacheAccessor(CONTRACT_ADDRESS, new StateCache());
const senderContract = new BarSmartContract(SENDER_ADDRESS, adapter);
const recipientContract = new BarSmartContract(RECIPIENT_ADDRESS, adapter);
const superuserContract = new BarSmartContract(BarSmartContract.SUPERUSER, adapter);

describe("bar contract - transfer tests", () => {
  it("init token balances", async () => {
    await superuserContract.initBalance(SENDER_ADDRESS, 1);
    await superuserContract.initBalance(RECIPIENT_ADDRESS, 1);
    expect(await senderContract.getMyBalance()).to.equal(1);
    expect(await recipientContract.getMyBalance()).to.equal(1);
  });

  it("transfers 1 token from one account to another", async () => {
    await superuserContract.initBalance(SENDER_ADDRESS, 2);
    await superuserContract.initBalance(RECIPIENT_ADDRESS, 0);

    await senderContract.transfer(RECIPIENT_ADDRESS, 1);

    expect(await senderContract.getMyBalance()).to.equal(1);
    expect(await recipientContract.getMyBalance()).to.equal(1);
  });
});
