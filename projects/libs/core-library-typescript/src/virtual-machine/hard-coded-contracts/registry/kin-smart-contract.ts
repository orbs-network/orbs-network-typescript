import BaseSmartContract from "../base-smart-contact";

export default class KinSmartContract extends BaseSmartContract {
  static readonly SUPERUSER = "0000";

  public async transfer(recipient: string, amount: number) {
    if (amount === 0) {
      throw this.validationError("Transaction amount must be > 0");
    }

    const senderBalance: number = await this.getBalanceForAccount(this.senderAddressBase58);
    // auto-fund accounts
    if (senderBalance == 0) {
      this.initBalance(this.senderAddressBase58, 10000);
    }

    if (senderBalance < amount) {
      throw this.validationError(`Balance is not sufficient ${senderBalance} < ${amount}`);
    }

    // TODO: no integer overflow protection
    // TODO: conversion of float to string is lossy
    const recipientBalance: number = await this.getBalanceForAccount(recipient);

    await this.setBalance(this.senderAddressBase58, senderBalance - amount);
    await this.setBalance(recipient, recipientBalance + amount);
  }

  public async getBalance() {
    return this.getBalanceForAccount(this.senderAddressBase58);
  }

  private async getBalanceForAccount(account: string) {
    const balance = await this.state.load(this.getAccountBalanceKey(account));
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async initBalance(account: string, amount: number) {
    this.setBalance(account, amount);
  }

  private async setBalance(account: string, amount: number) {
    return this.state.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
  }

  private getAccountBalanceKey(account: string) {
    return `balances.${account}`;
  }
}
