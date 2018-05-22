import { OrbsClient } from "./orbs-client";
import { Address } from "./address";
import * as crypto from "crypto";

export type OrbsContractMethodArgs = [string | number] | any[];

export class OrbsContract {
  public orbsClient: OrbsClient;
  public contractAddress: Address;

  constructor(orbsClient: OrbsClient, contractName: string) {
    this.orbsClient = orbsClient;
    const contractKey = crypto.createHash("sha256").update(contractName).digest("hex");
    this.contractAddress = new Address(
      contractKey,
      this.orbsClient.senderAddress.virtualChainId,
      this.orbsClient.senderAddress.networkId.toString()
    );
  }

  public async sendTransaction(methodName: string, args: OrbsContractMethodArgs) {
    const payload = this.generateSendTransactionPayload(methodName, args);
    return await this.orbsClient.sendTransaction(this.contractAddress, payload);
  }

  public generateSendTransactionPayload(methodName: string, args: OrbsContractMethodArgs) {
    let argsToUse = args;
    if (args == undefined) {
      argsToUse = [];
    }
    return JSON.stringify({
      method: methodName,
      args: argsToUse
    });
  }

  public async call(methodName: string, args: OrbsContractMethodArgs) {
    const payload = this.generateCallPayload(methodName, args);
    return this.orbsClient.call(this.contractAddress, payload);
  }

  public generateCallPayload(methodName: string, args: OrbsContractMethodArgs) {
    let argsToUse = args;
    if (args == undefined) {
      argsToUse = [];
    }
    return JSON.stringify({
      method: methodName,
      args: argsToUse
    });
  }
}
