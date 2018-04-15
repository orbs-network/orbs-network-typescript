import { types } from "../common-library/types";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";

export namespace TransactionUtils {
  export function calculateTransactionHash(transaction: types.Transaction): Buffer {
    const hash = createHash("sha256");
    hash.update(stringify(transaction.header));
    hash.update(stringify(transaction.payload));
    return hash.digest();
  }

  export function calculateTransactionId(transaction: types.Transaction) {
    return calculateTransactionHash(transaction).toString("hex");
  }
}
