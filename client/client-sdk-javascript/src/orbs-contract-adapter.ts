import { OrbsClient } from "./orbs-client";
import { SendTransactionOutput } from "orbs-interfaces";

export type OrbsContractMethodArgs = [string | number] | any[];

export class OrbsContractAdapter {
  orbsClient: OrbsClient;
  contractAddress: string;

  constructor(orbsClient: OrbsClient, contractAddress: string) {
    this.orbsClient = orbsClient;
    this.contractAddress = contractAddress;
  }

  public async sendTransaction(methodName: string, args: OrbsContractMethodArgs): Promise<SendTransactionOutput> {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return await this.orbsClient.sendTransaction(this.contractAddress, payload);
  }

  public async call(methodName: string, args: OrbsContractMethodArgs) {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return this.orbsClient.call(this.contractAddress, payload);
  }
}
