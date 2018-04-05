import { types, logger } from "../common-library";

export interface TransactionPoolConfig {
  transactionLifespanMs?: number;
  cleanupIntervalMs?: number;
}

export default abstract class BaseTransactionPool {
  static readonly DEFAULT_TRANSACTION_LIFESPAN_MS = 1000 * 30;
  static readonly DEFAULT_CLEANUP_INTERVAL = 1000 * 15;
  public readonly transactionLifespanMs: number;
  public readonly cleanupIntervalMs: number;
  private cleanupTimer: NodeJS.Timer;

  constructor(config?: TransactionPoolConfig) {
    this.cleanupIntervalMs = (config && config.cleanupIntervalMs) || BaseTransactionPool.DEFAULT_CLEANUP_INTERVAL;
    this.transactionLifespanMs = (config && config.transactionLifespanMs) || BaseTransactionPool.DEFAULT_TRANSACTION_LIFESPAN_MS;
  }

  abstract clearExpiredTransactions(): number;

  public startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      const count = this.clearExpiredTransactions();
      logger.debug(`Cleaned up ${count} transactions from pool. Class name: ${this.constructor.name}`);
    }, this.cleanupIntervalMs);
  }

  public stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  protected isExpired(timestamp: number): boolean {
    const expiryTimestamp = timestamp + this.transactionLifespanMs;
    return  expiryTimestamp < Date.now();
  }

  protected isTransactionExpired(transaction: types.Transaction): boolean {
    return this.isExpired(Number(transaction.header.timestamp));
  }
}
