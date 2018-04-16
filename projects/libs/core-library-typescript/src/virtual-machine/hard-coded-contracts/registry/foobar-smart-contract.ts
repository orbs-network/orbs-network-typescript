import BaseSmartContract from "../base-smart-contact";

export default class FooBarSmartContract extends BaseSmartContract {
  static readonly SUPERUSER = "0000";

  public async transfer(recipient: string, amount: number) {
    if (amount === 0) {
      throw this.validationError("transaction amount must be > 0");
    }

    const senderBalance: number = await this.getBalance(this.senderAddressBase58);
    if (senderBalance < amount) {
      throw this.validationError(`balance is not sufficient ${senderBalance} < ${amount}`);
    }

    // TODO: no integer overflow protection
    // TODO: conversion of float to string is lossy
    const recipientBalance: number = await this.getBalance(recipient);

    await this.setBalance(this.senderAddressBase58, senderBalance - amount);
    await this.setBalance(recipient, recipientBalance + amount);
  }

  public async initBalance(account: string, amount: number) {
    this.setBalance(account, amount);
  }

  public async getMyBalance() {
    return this.getBalance(this.senderAddressBase58);
  }

  private async getBalance(account: string) {
    const balance = await this.state.load(this.getAccountBalanceKey(account));
    return balance != undefined ? JSON.parse(balance) : 0;
  }

  private async setBalance(account: string, amount: number) {
    return this.state.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
  }

  private getAccountBalanceKey(account: string) {
    return `balances.${account}`;
  }
}
