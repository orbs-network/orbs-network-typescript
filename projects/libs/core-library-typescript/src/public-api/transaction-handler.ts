/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
