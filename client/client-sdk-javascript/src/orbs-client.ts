import { delay } from "bluebird";
import { Transaction, SendTransactionOutput } from "orbs-interfaces";
import * as request from "request-promise";
import { Address } from "./address";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest } from "./orbs-api-interface";

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
    const transaction = this.generateTransactionRequest(contractAddress, payload);

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
    const callData: OrbsAPICallContractRequest = {
      senderAddressBase58: this.senderAddress.toString(),
      contractAddressBase58: contractAddress.toString(),
      payload: payload
    };
    const body = await request.post({
      url: `${this.endpoint}/public/callContract`,
      body: callData,
      json: true
    });

    return body.result;
  }

  public generateTransactionRequest(contractAddress: Address, payload: string, timestamp: number = Date.now()): OrbsAPISendTransactionRequest {
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
