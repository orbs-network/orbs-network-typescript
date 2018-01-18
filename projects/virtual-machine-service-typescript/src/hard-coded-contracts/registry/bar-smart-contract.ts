import BaseSmartContract from "../base-smart-contact";

export default class BarSmartContract extends BaseSmartContract {
    static readonly SUPERUSER = "0000";

    public async transfer(recipient: string, amount: number) {
        if (amount === 0) {
            throw new Error("transaction amount must be > 0");
        }

        const senderBalance: number = await this.getBalance(this.sender);
        if (senderBalance < amount) {
            throw new Error(`balance is not sufficient ${senderBalance} < ${amount}`);
        }

        // TODO: no integer overflow protection
        // TODO: conversion of float to string is lossy
        const recipientBalance: number  = await this.getBalance(recipient);

        await this.setBalance(this.sender, senderBalance - amount);
        await this.setBalance(recipient,  recipientBalance + amount);
    }

    public async initBalance(account: string, amount: number) {
        // if (this.sender != BarSmartContract.SUPERUSER)
        //     throw new Error("Not a super user");
        this.setBalance(account, amount);
    }

    public async getMyBalance() {
        return this.getBalance(this.sender);
    }

    private async getBalance(account: string) {
        const balance = await this.stateAccessor.load(this.getAccountBalanceKey(account));
        return balance != undefined ? JSON.parse(balance) : 0;
    }

    private async setBalance(account: string, amount: number) {
        return this.stateAccessor.store(this.getAccountBalanceKey(account), JSON.stringify(amount));
    }

    private getAccountBalanceKey(account: string) {
        return `balances.${account}`;
    }


}