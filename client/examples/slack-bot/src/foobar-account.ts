import { OrbsContract } from "orbs-client-sdk";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export class FooBarAccount {
  contract: OrbsContract;
  address: string;
  username: string;

  public constructor(username: string, address: string, contract: OrbsContract) {
    this.username = username;
    this.contract = contract;
    this.address = address;
  }

  public async transfer(to: string, amount: number) {
    return await this.contract.sendTransaction("transfer", [to, amount]);
  }

  public async initBalance(account: string, balance: number) {
    return await this.contract.sendTransaction("initBalance", [account, balance]);
  }

  public async getMyBalance() {
    return this.contract.call("getMyBalance", []);
  }
}
