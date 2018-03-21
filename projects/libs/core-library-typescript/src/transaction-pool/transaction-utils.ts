import { types } from "../common-library/types";
import { createHash } from "crypto";

export const TRANSACTION_LIFESPAN_MS = 1000 * 30;

export function isExpired(timestamp: number): boolean {
  return timestamp + TRANSACTION_LIFESPAN_MS < Date.now();
}

export function isTransactionExpired(transaction: types.Transaction): boolean {
  return this.isExpired(transaction.header.timestamp);
}

export function calculateTransactionHash(transaction: types.Transaction): Buffer {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(transaction.header));
  hash.update(JSON.stringify(transaction.body));
  return hash.digest();
}

export function calculateTransactionId(transaction: types.Transaction) {
  return calculateTransactionHash(transaction).toString("hex");
}
