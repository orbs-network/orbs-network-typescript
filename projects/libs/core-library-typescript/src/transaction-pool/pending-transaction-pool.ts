import { logger, types, TransactionHelper, transactionHashToId } from "../common-library";
import { CommittedTransactionPool } from "./committed-transaction-pool";
import BaseTransactionPool, { TransactionPoolConfig } from "./base-transaction-pool";
import { TransactionValidator } from "./transaction-validator";
import { TransactionStatus } from "orbs-interfaces";

export class PendingTransactionPool extends BaseTransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();
  private gossip: types.GossipClient;

  private transactionValidator: TransactionValidator;

  constructor(gossip: types.GossipClient, transactionValidator: TransactionValidator, config?: TransactionPoolConfig) {
    super(config);
    this.gossip = gossip;
    this.transactionValidator = transactionValidator;
  }

  public async addNewPendingTransaction(transaction: types.Transaction): Promise<string> {
    const txid = await this.storePendingTransaction(transaction);
    await this.broadcastTransactionToOtherNodes(transaction);
    return txid;
  }

  public hasTransactionWithId(txid: string): boolean {
    return this.pendingTransactions.has(txid);
  }

  public getTransactionStatus(txid: string): types.GetTransactionStatusOutput {
    const receipt = <types.TransactionReceipt>undefined;
    let status: types.TransactionStatus = TransactionStatus.NOT_FOUND;

    if (this.pendingTransactions.has(txid)) {
      status = types.TransactionStatus.PENDING;
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
    try {
      this.storePendingTransaction(transaction);
    } catch (err) {
      logger.info(`failed storing pending transaction: ${JSON.stringify(transaction)}`);
    }
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

  public getQueueSize(): number {
    return this.pendingTransactions.size;
  }

  public async clearCommittedTransactionsFromPendingPool(transactionReceipts: types.TransactionReceipt[]) {
    for (const { txHash } of transactionReceipts) {
      const txid = transactionHashToId(txHash);
      this.pendingTransactions.delete(txid);
    }
  }

  private async storePendingTransaction(transaction: types.Transaction) {
    if (this.isTransactionExpired(transaction)) {
      throw new Error(`Transaction ${JSON.stringify(transaction)} has expired. not storing in the pool`);
    }

    if (!this.transactionValidator.validate(transaction)) {
      throw new Error(`transaction ${JSON.stringify(transaction)} is not valid. not storing in the pool`);
    }
    const txid = new TransactionHelper(transaction).calculateTransactionId();

    if (this.pendingTransactions.has(txid)) {
      throw new Error(`Transaction with id ${txid} already exists in the transaction pool`);
    }

    this.pendingTransactions.set(txid, transaction);

    logger.debug(`Added a new transaction ${JSON.stringify(transaction)} to the pool`);

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
