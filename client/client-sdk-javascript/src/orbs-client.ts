import { delay } from "bluebird";
import { Transaction, SendTransactionOutput } from "orbs-interfaces";
import * as request from "request-promise";
import { Address } from "./address";

export class OrbsClient {
  private endpoint: string;
  readonly senderAddress: Address;
  private sendTransactionTimeoutMs: number;

  constructor(endpoint: string, senderAddress: Address, sendTransactionTimeoutMs = 5000) {
    this.senderAddress = senderAddress;
    this.endpoint = endpoint;
    this.sendTransactionTimeoutMs = sendTransactionTimeoutMs;
  }

  async sendTransaction(contractAddress: Address, payload: string): Promise<any> {
    const transaction = this.generateTransaction(contractAddress, payload);

    const body = await request.post({
      url: `${this.endpoint}/public/sendTransaction`,
      body: transaction,
      json: true
    });

    // TODO: block until we implement transaction receipts with proper sync interface at HTTP endpoint
    await delay(this.sendTransactionTimeoutMs);
    return body.result;
  }

  async call(contractAddress: Address, payload: string): Promise<any> {
    const body = await request.post({
      url: `${this.endpoint}/public/callContract`,
      body: {
        senderAddressBase58: this.senderAddress.toString(),
        contractAddressBase58: contractAddress.toString(),
        payload: payload
      },
      json: true
    });

    return body.result;
  }

  public generateTransaction(contractAddress: Address, payload: string, timestamp: number = Date.now()) {
    return {
      header: {
        version: 0,
        senderAddressBase58: this.senderAddress.toString(),
        timestamp: timestamp.toString(),
        contractAddressBase58: contractAddress.toString()
      },
      payload
    };
  }
}
