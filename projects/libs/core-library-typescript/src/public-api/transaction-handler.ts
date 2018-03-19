import { types } from "../common-library/types";

export interface TransactionHandlerConfig {
  validateSubscription(): boolean;
}

export class TransactionHandler {
  private transactionPool: types.TransactionPoolClient;
  private subscriptionManager: types.SubscriptionManagerClient;
  private config: TransactionHandlerConfig;

  public async handle(transactionInput: types.SendTransactionInput) {
    const { transaction, transactionSubscriptionAppendix } = transactionInput;

    if (transaction.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${transaction.header.version}`);
    }

    if (this.config.validateSubscription()) {
      const subscriptionKey = transactionSubscriptionAppendix.subscriptionKey;

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
