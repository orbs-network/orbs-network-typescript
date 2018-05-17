import BaseSmartContract from "../base-smart-contact";

export default class KinAtnSmartContract extends BaseSmartContract {
  static readonly ALLOCATED_ACCOUNT_NAME = "repository_source";
  static readonly ONE_MILLION = 1000000;
  static readonly ONE_BILLION = KinAtnSmartContract.ONE_MILLION * 1000;
  static readonly DEFAULT_BALANCE = 10000;
  static readonly POOL_INITIAL_VALUE = KinAtnSmartContract.ONE_BILLION * 20;

  public async transfer(recipient: string, amount: number) {
    if (amount <= 0) {
      throw this.validationError("Transaction amount must be > 0");
    }

    let senderBalance: number = await this.getBalanceForAccount(this.senderAddressBase58);
    // auto-fund accounts
    if (senderBalance == 0) {
      senderBalance = await this.financeAccount(this.senderAddressBase58);
    }

    if (senderBalance < amount) {
      throw this.validationError(`Insufficient balance ${senderBalance} < ${amount}`);
    }

    // TODO: no integer overflow protection
    // TODO: conversion of float to string is lossy
    let recipientBalance: number = await this.getBalanceForAccount(recipient);
    if (recipientBalance == 0) {
      // this is to finance a new account that is receiving money for the first time
      recipientBalance = await this.financeAccount(recipient);
    }

    await this.setBalance(this.senderAddressBase58, senderBalance - amount);
    await this.setBalance(recipient, recipientBalance + amount);
  }

  public async getBalance() {
    return this.getBalanceForAccount(this.senderAddressBase58);
  }

  private async reduceFromPool(amount: number) {
    let allocatedBalance = await this.getBalanceForAccount(KinAtnSmartContract.ALLOCATED_ACCOUNT_NAME);
    if (allocatedBalance == 0) {
      // reset/init the pool
      await this.setBalance(KinAtnSmartContract.ALLOCATED_ACCOUNT_NAME, KinAtnSmartContract.POOL_INITIAL_VALUE);
      allocatedBalance = await this.getBalanceForAccount(KinAtnSmartContract.ALLOCATED_ACCOUNT_NAME);
    }
    await this.setBalance(KinAtnSmartContract.ALLOCATED_ACCOUNT_NAME, allocatedBalance - amount);
  }

  public async financeAccount(accountToFinance: string): Promise<number> {
    await this.setBalance(accountToFinance, KinAtnSmartContract.DEFAULT_BALANCE);
    await this.reduceFromPool(KinAtnSmartContract.DEFAULT_BALANCE);

    return KinAtnSmartContract.DEFAULT_BALANCE;
  }

  private async getBalanceForAccount(account: string): Promise<number> {
    const balance = await this.state.load(this.getAccountBalanceKey(account));
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async setBalance(account: string, amount: number) {
    this.state.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
  }

  private getAccountBalanceKey(account: string) {
    return `balances.${account}`;
  }
}
