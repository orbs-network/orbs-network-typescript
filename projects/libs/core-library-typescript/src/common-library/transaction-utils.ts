import { types } from "../common-library/types";
import { createHash } from "crypto";

export namespace TransactionUtils {
  export function calculateTransactionHash(transaction: types.Transaction): Buffer {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(transaction.header));
    hash.update(JSON.stringify(transaction.body));
    return hash.digest();
  }

  export function calculateTransactionId(transaction: types.Transaction) {
    return calculateTransactionHash(transaction).toString("hex");
  }
}
