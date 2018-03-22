import { delay } from "bluebird";

import { PublicApiClient, Transaction, UniversalAddress } from "orbs-interfaces";

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
      transactionSubscriptionAppendix: {
        subscriptionKey: this.subscriptionKey
      }
    });
    await delay(10000);
    return res;
  }

  async call(contractAddress: string, payload: string) {
    const { resultJson } = await this.orbsClient.callContract({
      sender: this.getAddress(),
      contractAddress: {address: contractAddress},
      payload: payload
    });
    return JSON.parse(resultJson);
  }

  public generateTransaction(contractAddress: string, payload: string): Transaction {
    return {
      header: {
        version: 0,
        sender: this.getAddress(),
        sequenceNumber: 0
      },
      body: {
        contractAddress: {address: contractAddress},
        payload: payload
      },
    };
  }

  public getAddress(): UniversalAddress {
    return {id: new Buffer(this.senderAddress), scheme: 0, networkId: 0, checksum: 0};
  }
}
