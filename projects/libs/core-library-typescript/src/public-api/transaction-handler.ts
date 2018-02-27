import { types } from "../common-library/types";

export interface TransactionHandlerConfig {
  validateSubscription(): boolean;
}

export class TransactionHandler {
  private gossip: types.GossipClient;
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

    await this.broadcastTransaction(transaction);
  }

  private async broadcastTransaction(transaction: types.Transaction) {
    await this.gossip.broadcastMessage({
      BroadcastGroup: "transactionPool",
      MessageType: "newTransaction",
      Buffer: new Buffer(JSON.stringify({transaction})),
      Immediate: true
    });
  }

  constructor(gossip: types.GossipClient, subscriptionManager: types.SubscriptionManagerClient,
    config: TransactionHandlerConfig) {
    this.gossip = gossip;
    this.subscriptionManager = subscriptionManager;
    this.config = config;
  }
}
