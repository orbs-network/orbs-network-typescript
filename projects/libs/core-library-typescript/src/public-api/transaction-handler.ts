import { types } from "../common-library/types";

export interface TransactionHandlerConfig {
  validateSubscription(): boolean;
}

export class TransactionHandler {
  private transactionPool: types.TransactionPoolClient;
  private subscriptionManager: types.SubscriptionManagerClient;
  private config: TransactionHandlerConfig;

  public async handle(transactionInput: types.SendTransactionInput) {
    const { transaction, transactionAppendix } = transactionInput;

    if (transaction.version !== 0) {
      throw new Error(`Invalid transaction version: ${transaction.version}`);
    }

    if (transactionAppendix.version !== 0) {
      throw new Error(`Invalid transaction appendix version: ${transactionAppendix.version}`);
    }

    if (this.config.validateSubscription()) {
      const subscriptionKey = transactionAppendix.subscriptionKey;

      const { active } = await this.subscriptionManager.getSubscriptionStatus({ subscriptionKey });

      if (!active) {
        throw new Error(`subscription with key [${subscriptionKey}] inactive`);
      }
    }

    await this.transactionPool.addNewPendingTransaction({ transaction });
  }

  constructor(transactionPool: types.TransactionPoolClient, subscriptionManager: types.SubscriptionManagerClient,
    config: TransactionHandlerConfig) {
    this.transactionPool = transactionPool;
    this.subscriptionManager = subscriptionManager;
    this.config = config;
  }
}
