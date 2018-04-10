import { delay } from "bluebird";

import { Transaction, UniversalAddress, SendTransactionOutput } from "orbs-interfaces";
import PublicApiConnection from "./public-api-connection";
import { createConnection } from "./grpc-connection";

export class OrbsClient {
  private connection: PublicApiConnection;
  private senderAddress: string;
  private sendTransactionTimeoutMs: number;

  constructor(senderAddress?: string, connection?: PublicApiConnection, sendTransactionTimeoutMs = 5000) {
    this.senderAddress = senderAddress;
    this.setConnection(connection);
    this.sendTransactionTimeoutMs = sendTransactionTimeoutMs;
  }

  async sendTransaction(contractAddress: string, payload: string): Promise<SendTransactionOutput> {
    if (this.connection == undefined) {
      throw new Error("No connection is set");
    }

    const transaction = this.generateTransaction(contractAddress, payload);

    const res = await this.connection.sendTransaction({ transaction });
    await delay(this.sendTransactionTimeoutMs);
    return res;
  }

  async call(contractAddress: string, payload: string) {
    if (this.connection == undefined) {
      throw new Error("No connection is set");
    }

    const { resultJson } = await this.connection.callContract({
      sender: this.getSenderAddress(),
      contractAddress: {address: contractAddress},
      payload: payload
    });
    return JSON.parse(resultJson);
  }

  public setConnection(connection: PublicApiConnection) {
    this.connection = connection;
  }

  public generateTransaction(contractAddress: string, payload: string, timestamp: number = Date.now()): Transaction {
    return {
      header: {
        version: 0,
        sender: this.getSenderAddress(),
        timestamp: timestamp.toString()
      },
      body: {
        contractAddress: {address: contractAddress},
        payload: payload
      },
    };
  }

  public getSenderAddress(): UniversalAddress {
    if (this.senderAddress == undefined) {
      throw new Error("sender address is not set");
    }
    // temporary hacky mapping
    return {id: new Buffer(this.senderAddress), scheme: 0, networkId: 0, checksum: 0 };
  }

  public connectToGrpcNode(endpoint: string) {
    this.connection = createConnection({ endpoint });
  }

  public async disconnect() {
    return this.connection.close();
  }
 }
