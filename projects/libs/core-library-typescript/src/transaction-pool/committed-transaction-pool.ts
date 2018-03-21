import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";
import { isExpired } from "./transaction-utils";

export class CommittedTransactionPool {
  private committedTransactions = new Map<string, number>();
  private gossip: types.GossipClient;

  constructor(gossip: types.GossipClient) {
    this.gossip = gossip;
  }

  public hasTransactionWithId(txid: string): boolean {
    return this.committedTransactions.has(txid);
  }

  public clearExpiredTransactions() {
    for (const [txid, timestamp] of this.committedTransactions.entries()) {
      if (isExpired(timestamp)) {
        this.committedTransactions.delete(txid);
      }
    }
  }

  public addCommittedTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    for (const { txHash, timestamp } of transactionEntries) {
      const txid = txHash.toString("hex");

      if (isExpired(timestamp)) {
        continue;
      }

      this.committedTransactions.set(txid, timestamp);
    }
  }
}
