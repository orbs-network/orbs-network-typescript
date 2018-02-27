import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";

export class TransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();

  public async addNewPendingTransaction(transaction: types.Transaction) {
    const txHash = this.calculateTransactionHash(transaction);
    if (this.pendingTransactions.has(txHash)) {
      throw `transaction with hash ${txHash} already exists in the pool`;
    }

    logger.debug(`added a new transaction ${JSON.stringify(transaction)} to the pool`);

    this.pendingTransactions.set(txHash, transaction);
  }

  private calculateTransactionHash(transaction: types.Transaction) {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(transaction));
    return hash.digest("hex");
  }

  public async pullAllPendingTransactions(): Promise<types.PullAllPendingTransactionsOutput> {
    // TODO: pull FIFO
    // TODO: solve concurrency issues
    const transactions = Array.from(this.pendingTransactions.values());
    this.pendingTransactions.clear();
    return { transactions };
  }

  public async gossipMessageReceived(fromAddress: string, messageType: string, message: types.GossipMessageReceivedData) {
    if (messageType == "newTransaction") {
      this.addNewPendingTransaction(message.transaction);
    } else {
      throw `Unsupported message type ${messageType}`;
    }
  }
}
