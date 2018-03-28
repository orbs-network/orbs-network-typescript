import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";
import BaseTransactionPool from "./base-transaction-pool";

export class CommittedTransactionPool extends BaseTransactionPool {
  private committedTransactions = new Map<string, number>();

  public hasTransactionWithId(txid: string): boolean {
    return this.committedTransactions.has(txid);
  }

  public clearExpiredTransactions(): number {
    let count = 0;
    for (const [txid, timestamp] of this.committedTransactions.entries()) {
      if (this.isExpired(timestamp)) {
        this.committedTransactions.delete(txid);
        count++;
      }
    }
    return count;
  }

  public addCommittedTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    for (const { txHash, timestamp } of transactionEntries) {
      const txid = txHash.toString("hex");
      const timestampInt = parseInt(timestamp);

      if (this.isExpired(timestampInt)) {
        continue;
      }

      this.committedTransactions.set(txid, timestampInt);
    }
  }
}
