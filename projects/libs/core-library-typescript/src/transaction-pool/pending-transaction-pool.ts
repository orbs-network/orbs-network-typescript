import { logger, types, TransactionHelper } from "../common-library";
import { CommittedTransactionPool } from "./committed-transaction-pool";
import BaseTransactionPool, { TransactionPoolConfig } from "./base-transaction-pool";
import { TransactionStatus } from "orbs-interfaces";

export class PendingTransactionPool extends BaseTransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();
  public committedTransactionPool: CommittedTransactionPool;
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

  public getTransactionStatus(txid: string): types.GetTransactionStatusOutput {
    let receipt: types.TransactionReceipt;
    let status: types.TransactionStatus = TransactionStatus.NOT_FOUND;

    if (this.pendingTransactions.has(txid)) {
      status = types.TransactionStatus.PENDING;
    } else if (this.committedTransactionPool.hasTransactionWithId(txid)) {
      receipt = this.committedTransactionPool.getTransactionReceiptWithId(txid);
      status = types.TransactionStatus.COMMITTED;
    }

    return { status , receipt };
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

  public markCommittedTransactions(transactionReceipts: types.TransactionReceipt[]) {
    this.committedTransactionPool.addCommittedTransactions(transactionReceipts);

    this.clearCommittedTransactionsFromPendingPool(transactionReceipts);
  }

  public getQueueSize(): number {
    return this.pendingTransactions.size;
  }

  private clearCommittedTransactionsFromPendingPool(transactionReceipts: types.TransactionReceipt[]) {
    for (const { txHash } of transactionReceipts) {
      const txid = txHash.toString("hex");
      this.pendingTransactions.delete(txid);
    }
  }


  private async storePendingTransaction(transaction: types.Transaction) {
    if (this.isTransactionExpired(transaction)) {
      throw new Error(`transaction ${JSON.stringify(transaction)} has expired. not storing in the pool`);
    }

    const txid = new TransactionHelper(transaction).calculateTransactionId();
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
