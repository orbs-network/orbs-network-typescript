/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types, logger } from "../common-library";

export interface TransactionPoolConfig {
  transactionLifespanMs?: number;
  cleanupIntervalMs?: number;
}

export default abstract class BaseTransactionPool {
  static readonly DEFAULT_TRANSACTION_LIFESPAN_MS = 1000 * 30;
  static readonly DEFAULT_CLEANUP_INTERVAL_MS = 1000 * 15;
  public readonly transactionLifespanMs: number;
  public readonly cleanupIntervalMs: number;
  private cleanupTimer: NodeJS.Timer;

  constructor(config?: TransactionPoolConfig) {
    this.cleanupIntervalMs = (config && config.cleanupIntervalMs) || BaseTransactionPool.DEFAULT_CLEANUP_INTERVAL_MS;
    this.transactionLifespanMs = (config && config.transactionLifespanMs) || BaseTransactionPool.DEFAULT_TRANSACTION_LIFESPAN_MS;
  }

  abstract clearExpiredTransactions(): number;

  public startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.stopCleanupTimer();
      const count = this.clearExpiredTransactions();
      logger.debug(`Cleaned up ${count} transactions from pool. Class name: ${this.constructor.name}`);
      this.startCleanupTimer();
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
