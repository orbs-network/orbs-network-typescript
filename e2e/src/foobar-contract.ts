/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { OrbsContract } from "orbs-client-sdk";
export class FooBarContractClient {
  adapter: OrbsContract;

  public constructor(adapter: OrbsContract) {
    this.adapter = adapter;
  }

  public async initBalance(account: string, balance: number) {
    return await this.adapter.sendTransaction("initBalance", [account, balance]);
  }

  public async transfer(to: string, amount: number) {
    return await this.adapter.sendTransaction("transfer", [to, amount]);
  }

  public async getMyBalance() {
    return this.adapter.call("getMyBalance", []);
  }
}

export class FooBarAccount {
  // crypto: CryptoUtils;
  foobarContractClient: FooBarContractClient;
  readonly address: string;

  constructor(accountAddress: string, adapter: OrbsContract) {
    this.foobarContractClient = new FooBarContractClient(adapter);
    this.address = accountAddress;
  }

  public async initBalance(bars: number) {
    return await this.foobarContractClient.initBalance(this.address, bars);
  }

  public async transfer(transaction: { to: string, amountOfBars: number }) {
    await this.foobarContractClient.transfer(transaction.to, transaction.amountOfBars);
  }

  public async getBalance(): Promise<number> {
    return await this.foobarContractClient.getMyBalance();
  }
}

const { Assertion } = require("chai");

async function assertFooBarAccountBalance(n: number) {
  // make sure we are working with am Account model
  new Assertion(this._obj).to.be.instanceof(FooBarAccount);

  const account = <FooBarAccount>this._obj;

  const actualBars = await account.getBalance();

  this.assert(
    actualBars === n
    , "expected #{this} to have balance #{exp} but got #{act}"
    , "expected #{this} to not have balance #{act}"
    , n
    , actualBars
  );
}

Assertion.addMethod("bars", assertFooBarAccountBalance);
