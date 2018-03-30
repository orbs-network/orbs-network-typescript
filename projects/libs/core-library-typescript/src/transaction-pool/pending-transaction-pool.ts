import { logger, types, TransactionUtils } from "../common-library";
import { CommittedTransactionPool } from "./committed-transaction-pool";
import BaseTransactionPool, { TransactionPoolConfig } from "./base-transaction-pool";

const {calculateTransactionHash, calculateTransactionId} = TransactionUtils;

export class PendingTransactionPool extends BaseTransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();
  private committedTransactionPool: CommittedTransactionPool;
  private gossip: types.GossipClient;

  constructor(gossip: types.GossipClient, committedTransactionPool: CommittedTransactionPool, config?: TransactionPoolConfig) {
    super(config);
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

  public clearExpiredTransactions(): number {
    let count = 0;
    for (const [txid, transaction] of this.pendingTransactions.entries()) {
      if (this.isTransactionExpired(transaction)) {
        count++;
        this.pendingTransactions.delete(txid);
      }
    }
    return count;
  }

  public markCommittedTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    this.committedTransactionPool.addCommittedTransactions(transactionEntries);

    this.clearTransactions(transactionEntries);
  }

  public getQueueSize(): number {
    return this.pendingTransactions.size;
  }

  private clearTransactions(transactionEntries: types.CommittedTransactionEntry[]) {
    for (const { txHash, timestamp } of transactionEntries) {
      const txid = txHash.toString("hex");
      this.pendingTransactions.delete(txid);
    }
  }


  private async storePendingTransaction(transaction: types.Transaction) {
    if (this.isTransactionExpired(transaction)) {
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
