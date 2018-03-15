import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";

export class TransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();
  private gossip: types.GossipClient;

  constructor(gossip: types.GossipClient) {
    this.gossip = gossip;
  }

  public async addNewPendingTransaction(transaction: types.Transaction) {
    await this.storePendingTransaction(transaction);
    await this.broadcastTransactionToOtherNodes(transaction);
  }

  public getAllPendingTransactions(): types.GetAllPendingTransactionsOutput {
    // TODO: pull FIFO
    // TODO: solve concurrency issues
    const transactions = Array.from(this.pendingTransactions.values());
    return { transactions };
  }

  public clearPendingTransactions(transactions: types.Transaction[]) {
    if (transactions.length > 0) {
      logger.info(`Transaction pool is clearing ${transactions.length} pending transactions`);
    }

    for (const transaction of transactions) {
      this.broadcastClearTransactionToOtherNodes(transaction);
      this.clearPendingTransaction(transaction);
    }
  }

  public async gossipMessageReceived(fromAddress: string, messageType: string, message: types.GossipMessageReceivedData) {
    if (messageType == "newTransaction") {
      this.storePendingTransaction(message.transaction);
    } else if (messageType == "clearPendingTransaction") {
      logger.info(`Transaction pool received message from ${fromAddress} to clear transaction ${JSON.stringify(message.transaction)}`);
      this.clearPendingTransaction(message.transaction);
    } else {
      throw `Unsupported message type ${messageType}`;
    }
  }

  private async storePendingTransaction(transaction: types.Transaction) {
    const txHash = this.calculateTransactionHash(transaction);
    if (this.pendingTransactions.has(txHash)) {
      throw `transaction with hash ${txHash} already exists in the pool`;
    }
    this.pendingTransactions.set(txHash, transaction);

    logger.debug(`added a new transaction ${JSON.stringify(transaction)} to the pool`);
  }

  private async clearPendingTransaction(transaction: types.Transaction) {
    const txHash = this.calculateTransactionHash(transaction);
    this.pendingTransactions.delete(txHash);
  }

  private calculateTransactionHash(transaction: types.Transaction) {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(transaction));
    return hash.digest("hex");
  }

  private async broadcastTransactionToOtherNodes(transaction: types.Transaction) {
    await this.gossip.broadcastMessage({
      broadcastGroup: "transactionPool",
      messageType: "newTransaction",
      buffer: new Buffer(JSON.stringify({transaction})),
      immediate: true
    });
  }

  private async broadcastClearTransactionToOtherNodes(transaction: types.Transaction) {
    await this.gossip.broadcastMessage({
      broadcastGroup: "transactionPool",
      messageType: "clearPendingTransaction",
      buffer: new Buffer(JSON.stringify({transaction})),
      immediate: true
    });
  }
}
