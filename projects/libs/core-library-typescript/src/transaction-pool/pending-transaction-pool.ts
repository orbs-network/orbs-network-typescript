import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { isExpired, isTransactionExpired, calculateTransactionId } from "./transaction-utils";
import { CommittedTransactionPool } from "./committed-transaction-pool";

export class PendingTransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();
  private committedTransactionPool: CommittedTransactionPool;
  private gossip: types.GossipClient;

  constructor(gossip: types.GossipClient, committedTransactionPool: CommittedTransactionPool) {
    this.gossip = gossip;
    this.committedTransactionPool = committedTransactionPool;
  }

  public async addNewPendingTransaction(transaction: types.Transaction): Promise<string> {
    const txid = await this.storePendingTransaction(transaction);
    await this.broadcastTransactionToOtherNodes(transaction);
    return txid;
  }

  public getAllPendingTransactions(): types.TransactionEntry[] {
    const transactionEntries: types.TransactionEntry[] = [];
    for (const [txid, transaction] of this.pendingTransactions.entries()) {
      const txHash = Buffer.from(txid, "hex");
      transactionEntries.push({txHash, transaction});
    }
    return transactionEntries;
  }

  public onNewBroadcastTransaction(transaction: types.Transaction) {
    this.storePendingTransaction(transaction);
  }

  public clearExpiredTransactions() {
    for (const [txid, transaction] of this.pendingTransactions.entries()) {
      if (isTransactionExpired(transaction)) {
        this.pendingTransactions.delete(txid);
      }
    }
  }

  public markCommittedTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    this.committedTransactionPool.addCommittedTransactions(transactionEntries);

    this.clearTransactions(transactionEntries);
  }

  private clearTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    for (const { txHash, timestamp } of transactionEntries) {
      const txid = txHash.toString("hex");
      this.pendingTransactions.delete(txid);
    }
  }

  private async storePendingTransaction(transaction: types.Transaction) {
    if (isTransactionExpired(transaction)) {
      throw new Error(`transaction ${JSON.stringify(transaction)} has expired. not storing in the pool`);
    }

    const txid = calculateTransactionId(transaction);
    if (this.pendingTransactions.has(txid) || this.committedTransactionPool.hasTransactionWithId(txid)) {
      throw new Error(`transaction with id ${txid} already exists in the transaction pool`);
    }

    this.pendingTransactions.set(txid, transaction);

    logger.debug(`added a new transaction ${JSON.stringify(transaction)} to the pool`);

    return txid;
  }

  private async broadcastTransactionToOtherNodes(transaction: types.Transaction) {
    const message: types.NewTransactionBroadcastMessage = { transaction };
    await this.gossip.broadcastMessage({
      broadcastGroup: "transactionPool",
      messageType: "newTransaction",
      buffer: new Buffer(JSON.stringify(message)),
      immediate: true
    });
  }
}
