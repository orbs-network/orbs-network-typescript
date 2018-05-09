import { delay } from "bluebird";
import * as request from "request-promise";
import { Address } from "./address";
import { OrbsAPICallContractRequest, OrbsAPISendTransactionRequest, OrbsAPIGetTransactionStatusRequest, OrbsAPIGetTransactionStatusResponse } from "./orbs-api-interface";
import { ED25519Key } from ".";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";

export class OrbsClient {
  private endpoint: string;
  readonly senderAddress: Address;
  private sendTransactionTimeoutMs: number;
  private keyPair: ED25519Key;

  constructor(endpoint: string, senderAddress: Address, keyPair: ED25519Key, sendTransactionTimeoutMs = 5000) {
    this.senderAddress = senderAddress;
    this.endpoint = endpoint;
    this.sendTransactionTimeoutMs = sendTransactionTimeoutMs;
    this.keyPair = keyPair;
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
    const callData: OrbsAPICallContractRequest = this.generateCallRequest(contractAddress, payload);
    const body = await request.post({
      url: `${this.endpoint}/public/callContract`,
      body: callData,
      json: true
    });

    return body.result;
  }

  async getTransactionStatus(txid: string): Promise<OrbsAPIGetTransactionStatusResponse> {
    const requestData: OrbsAPIGetTransactionStatusRequest = { txid };

    const body = await request.post({
      url: `${this.endpoint}/public/getTransactionStatus`,
      body: requestData,
      json: true
    });

    return body;
  }

  public generateCallRequest(contractAddress: Address, payload: string): OrbsAPICallContractRequest {
    return {
      senderAddressBase58: this.senderAddress.toString(),
      contractAddressBase58: contractAddress.toString(),
      payload: payload
    };
  }

  public generateTransactionRequest(contractAddress: Address, payload: string, timestamp: number = Date.now()): OrbsAPISendTransactionRequest {
    // build transaction without signatute data
    const header = {
      version: 0,
      senderAddressBase58: this.senderAddress.toString(),
      timestamp: timestamp.toString(),
      contractAddressBase58: contractAddress.toString()
    };

    const hasher = createHash("sha256");
    hasher.update(stringify({header, payload}));
    const txHash = hasher.digest();
    const signatureHex =  this.keyPair.sign(txHash).toString("hex");

    const req: OrbsAPISendTransactionRequest = {
      header,
      payload,
      signatureData: {
        publicKeyHex: this.keyPair.publicKey,
        signatureHex
      }
    };
    return req;
  }
}
