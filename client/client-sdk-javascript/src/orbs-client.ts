import { delay } from "bluebird";

import { PublicApiClient, Transaction, UniversalAddress, SendTransactionOutput } from "orbs-interfaces";

export class OrbsClientSession {
  connection: PublicApiClient;
  subscriptionKey: string;
  senderAddress: string;

  constructor(senderAddress: string, subscriptionKey: string, connection: PublicApiClient) {
    this.senderAddress = senderAddress;
    this.connection = connection;
    this.subscriptionKey = subscriptionKey;
  }

  async sendTransaction(contractAddress: string, payload: string): Promise<SendTransactionOutput> {
    const signedTransaction = this.generateTransaction(contractAddress, payload);

    const res = await this.connection.sendTransaction({
      transaction: signedTransaction,
      transactionSubscriptionAppendix: {
        subscriptionKey: this.subscriptionKey
      }
    });
    await delay(10000);
    return res;
  }

  async call(contractAddress: string, payload: string) {
    const { resultJson } = await this.connection.callContract({
      sender: this.getAddress(),
      contractAddress: {address: contractAddress},
      payload: payload
    });
    return JSON.parse(resultJson);
  }

  public generateTransaction(contractAddress: string, payload: string, timestamp: number = Date.now()): Transaction {
    return {
      header: {
        version: 0,
        sender: this.getAddress(),
        timestamp: timestamp.toString()
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
