import { OrbsClient } from "./orbs-client";
import { SendTransactionOutput } from "orbs-interfaces";
import { Address } from "./address";
import * as crypto from "crypto";

export type OrbsContractMethodArgs = [string | number] | any[];

export class OrbsContractAdapter {
  orbsClient: OrbsClient;
  private contractAddress: Address;

  constructor(orbsClient: OrbsClient, contractName: string) {
    this.orbsClient = orbsClient;
    const contractKey = crypto.createHash("sha256").update(contractName).digest("hex");
    this.contractAddress = new Address(
      contractKey,
      this.orbsClient.senderAddress.virtualChainId,
      this.orbsClient.senderAddress.networkId.toString()
    );
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
