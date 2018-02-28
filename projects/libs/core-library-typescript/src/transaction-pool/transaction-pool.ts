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
    for (const transaction of transactions) {
      const txHash = this.calculateTransactionHash(transaction);
      this.pendingTransactions.delete(txHash);
    }
  }

  public async gossipMessageReceived(fromAddress: string, messageType: string, message: types.GossipMessageReceivedData) {
    if (messageType == "newTransaction") {
      this.storePendingTransaction(message.transaction);
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

  private calculateTransactionHash(transaction: types.Transaction) {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(transaction));
    return hash.digest("hex");
  }



  private async broadcastTransactionToOtherNodes(transaction: types.Transaction) {
    await this.gossip.broadcastMessage({
      BroadcastGroup: "transactionPool",
      MessageType: "newTransaction",
      Buffer: new Buffer(JSON.stringify({transaction})),
      Immediate: true
    });
  }
}
