import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";
import BaseTransactionPool from "./base-transaction-pool";
import { TransactionReceipt } from "orbs-interfaces";

export class CommittedTransactionPool extends BaseTransactionPool {
  public committedTransactions = new Map<string, {
    receipt: types.TransactionReceipt, entryTimestamp: number
  }>();

  public hasTransactionWithId(txid: string): boolean {
    return this.committedTransactions.has(txid);
  }

  public getTransactionReceiptWithId(txid: string): types.TransactionReceipt {
    if (this.hasTransactionWithId(txid)) {
      return this.committedTransactions.get(txid).receipt;
    }
  }

  public clearExpiredTransactions(): number {
    let count = 0;
    for (const [txid, entry] of this.committedTransactions.entries()) {
      if (this.isExpired(entry.entryTimestamp)) {
        this.committedTransactions.delete(txid);
        count++;
      }
    }
    return count;
  }

  public addCommittedTransactions(transactionReceipts: types.TransactionReceipt[]) {
    const entryTimestamp = Date.now();
    for (const receipt of transactionReceipts) {
      const txid = receipt.txHash.toString("hex");
      this.committedTransactions.set(txid, { entryTimestamp, receipt });
    }
  }
}
