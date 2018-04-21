import { types } from "../common-library/types";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";

export class TransactionHelper implements types.Transaction {
  header: types.TransactionHeader;
  payload: string;

  constructor(transaction: types.Transaction) {
    this.header = transaction.header;
    this.payload = transaction.payload;
  }

  public calculateHash(): Buffer {
    const hash = createHash("sha256");
    hash.update(stringify(this.header));
    hash.update(stringify(this.payload));
    return hash.digest();
  }

  public calculateTransactionId(): string {
    const hash = this.calculateHash();
    return transactionHashToId(hash);
  }
}

export function transactionHashToId(hash: Buffer) {
  return hash.toString("hex");
}
