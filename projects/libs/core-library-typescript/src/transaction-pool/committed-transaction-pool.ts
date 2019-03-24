/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { createHash } from "crypto";
import BaseTransactionPool from "./base-transaction-pool";
import { TransactionReceipt, TransactionStatus } from "orbs-interfaces";
import { transactionHashToId } from "..";

export class CommittedTransactionPool extends BaseTransactionPool {
  private committedTransactions = new Map<string, {
    receipt: types.TransactionReceipt, entryTimestamp: number
  }>();

  public hasTransactionWithId(txid: string): boolean {
    return this.committedTransactions.has(txid);
  }

  public getTransactionReceiptWithId(txid: string): types.TransactionReceipt {
    if (this.hasTransactionWithId(txid)) {
      return this.committedTransactions.get(txid).receipt;
    }
  }

  public getTransactionStatus(txid: string): types.GetTransactionStatusOutput {
    let receipt: types.TransactionReceipt;
    let status: types.TransactionStatus = TransactionStatus.NOT_FOUND;

    if (this.committedTransactions.has(txid)) {
      receipt = this.getTransactionReceiptWithId(txid);
      status = types.TransactionStatus.COMMITTED;
    }

    return { status , receipt };
  }

  public clearExpiredTransactions(): number {
    let count = 0;
    for (const [txid, entry] of this.committedTransactions.entries()) {
      if (this.isExpired(entry.entryTimestamp)) {
        this.committedTransactions.delete(txid);
        count++;
      }
    }
    return count;
  }

  public async addCommittedTransactions(transactionReceipts: types.TransactionReceipt[]) {
    const entryTimestamp = Date.now();
    for (const receipt of transactionReceipts) {
      const txid = transactionHashToId(receipt.txHash);
      this.committedTransactions.set(txid, { entryTimestamp, receipt });
    }
  }
}
