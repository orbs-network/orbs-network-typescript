import { delay } from "bluebird";

import { Transaction, PublicApiClient } from "./public-api-client";

type OrbsHardCodedContractMethodArgs = [string | number] | any[];

export class OrbsHardCodedContractAdapter {
  orbsSession: OrbsClientSession;
  contractAddress: string;

  constructor(orbsSession: OrbsClientSession, contractAddress: string) {
    this.orbsSession = orbsSession;
    this.contractAddress = contractAddress;
  }

  public async sendTransaction(methodName: string, args: OrbsHardCodedContractMethodArgs) {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return await this.orbsSession.sendTransaction(this.contractAddress, payload);
  }

  public async call(methodName: string, args: OrbsHardCodedContractMethodArgs) {
    const payload = JSON.stringify({
      method: methodName,
      args: args
    });
    return this.orbsSession.call(this.contractAddress, payload);
  }
}

export class OrbsClientSession {
  orbsClient: PublicApiClient;
  subscriptionKey: string;
  senderAddress: string;

  constructor(senderAddress: string, subscriptionKey: string, orbsClient: PublicApiClient) {
    this.senderAddress = senderAddress;
    this.orbsClient = orbsClient;
    this.subscriptionKey = subscriptionKey;
  }

  async sendTransaction(contractAddress: string, payload: string) {
    const signedTransaction = this.generateTransaction(contractAddress, payload);

    const res = await this.orbsClient.sendTransaction({
      transaction: signedTransaction,
      transactionAppendix: {
        prefetchAddresses: [],
        subscriptionKey: this.subscriptionKey
      }
    });
    await delay(10000);
    return res;
  }

  async call(contractAddress: string, payload: string) {
    const { resultJson } = await this.orbsClient.call({
      sender: this.getAddress(),
      contractAddress: contractAddress,
      payload: payload
    });
    return JSON.parse(resultJson);
  }

  public generateTransaction(contractAddress: string, payload: string): Transaction {
    return {
      sender: this.senderAddress,
      contractAddress: contractAddress,
      payload: payload,
      signature: "" // TODO: add a signature once implement in the network-side
    };
  }

  public getAddress() {
    return this.senderAddress;
  }
}
