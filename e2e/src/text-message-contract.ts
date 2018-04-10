import { OrbsContractAdapter } from "orbs-client-sdk";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export class TextMessageAccount {
  adapter: OrbsContractAdapter;
  address: string;

  public constructor(address: string, adapter: OrbsContractAdapter) {
    this.adapter = adapter;
    this.address = address;
  }

  public async sendMessage(recipient: string, message: string) {
    return await this.adapter.sendTransaction("sendMessage", [recipient, message, new Date().getTime()]);
  }

  public async getMyMessages() {
    return this.adapter.call("getMyMessages", []);
  }
}
