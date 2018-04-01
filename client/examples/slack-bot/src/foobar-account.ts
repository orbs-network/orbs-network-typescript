import { OrbsHardCodedContractAdapter } from "./orbs-client";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export class FooBarAccount {
  adapter: OrbsHardCodedContractAdapter;
  address: string;
  username: string;

  public constructor(username: string, address: string, adapter: OrbsHardCodedContractAdapter) {
    this.username = username;
    this.adapter = adapter;
    this.address = address;
  }

  public async transfer(to: string, amount: number) {
    return await this.adapter.sendTransaction("transfer", [to, amount]);
  }

  public async initBalance(account: string, balance: number) {
    return await this.adapter.sendTransaction("initBalance", [account, balance]);
  }

  public async getMyBalance() {
    return this.adapter.call("getMyBalance", []);
  }
}
