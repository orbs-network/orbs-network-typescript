import { types } from "../common-library/types";
import { logger } from "../common-library/logger";

export class TransactionHandler {
  private transactionPool: types.TransactionPoolClient;

  public async handle(transactionInput: types.SendTransactionInput) {
    const { transaction } = transactionInput;

    if (transaction.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${transaction.header.version}`);
    }

    await this.transactionPool.addNewPendingTransaction({ transaction });
  }

  constructor(transactionPool: types.TransactionPoolClient) {
    this.transactionPool = transactionPool;
  }
}
