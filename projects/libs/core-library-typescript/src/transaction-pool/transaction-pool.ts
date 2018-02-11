import { logger, types } from "../common-library";

export class TransactionPool {
  private pendingTransactions = new Map<string, types.Transaction>();

  public async addNewPendingTransaction(transaction: types.Transaction) {
    // if (!this.pendingTransactions.has(transaction.id)) {
    //   this.pendingTransactions.set(transaction.id, transaction);
    //   logger.info(`${topology.name}: after adding we have ${this.pendingTransactions.size} pending transactions`);
    // }
    // For example:
    // await this.peers.gossip.announceTransaction({ transaction: transaction });
  }

  public async addExistingPendingTransaction(transaction: types.Transaction) {
    // logger.info(`${topology.name}: addExistingPendingTransaction ${JSON.stringify(transaction)}`);
    // if (!this.pendingTransactions.has(transaction.id)) {
    //   this.pendingTransactions.set(transaction.id, transaction);
    //   logger.info(`${topology.name}: after adding we have ${this.pendingTransactions.size} pending transactions`);
    // }
  }
}
