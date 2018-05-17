import { types } from "../common-library/types";
import { logger } from "../common-library/logger";

export class TransactionHandler {
  private transactionPool: types.TransactionPoolClient;

  public async handle(transactionInput: types.SendTransactionInput): Promise<string> {
    const { transaction } = transactionInput;

    if (transaction.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${transaction.header.version}`);
    }

    const addNewResponse = await this.transactionPool.addNewPendingTransaction({ transaction });
    return addNewResponse.txid;
  }

  constructor(transactionPool: types.TransactionPoolClient) {
    this.transactionPool = transactionPool;
  }
}
