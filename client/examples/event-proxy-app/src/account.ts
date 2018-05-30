import { OrbsContract } from "orbs-client-sdk";

export class Account {
  contract: OrbsContract;
  address: string;
  userId: string;

  public constructor(userId: string, address: string, contract: OrbsContract) {
    this.userId = userId;
    this.contract = contract;
    this.address = address;
  }

  public async reportEvent(event: string) {
    return this.contract.sendTransaction("reportEvent", [event]);
  }

  public async getCounter(event: string) {
    return this.contract.call("getCounter", [event]);
  }
}
