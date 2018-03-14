import { OrbsHardCodedContractAdapter } from "./orbs-client";

export interface Message {
  recipient: string;
  sender: string;
  timestamp: number;
  processedAtTimestamp: number;
  message: string;
}

export class TextMessageAccount {
  adapter: OrbsHardCodedContractAdapter;
  address: string;

  public constructor(address: string, adapter: OrbsHardCodedContractAdapter) {
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
