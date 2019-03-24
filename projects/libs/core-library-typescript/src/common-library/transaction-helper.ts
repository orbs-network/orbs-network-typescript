/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types } from "../common-library/types";
import { createHash } from "crypto";
import * as stringify from "json-stable-stringify";
import { bs58EncodeRawAddress, Address } from ".";

export class TransactionHelper implements types.Transaction {
  header: types.TransactionHeader;
  payload: string;
  signatureData: types.TransactionSignatureData;

  constructor(transaction: types.Transaction) {
    this.header = transaction.header;
    this.payload = transaction.payload;
    this.signatureData = transaction.signatureData;
  }

  public calculateHash(): Buffer {
    const hash = createHash("sha256");
    hash.update(stringify({
      header: {
        contractAddressBase58: bs58EncodeRawAddress(this.header.contractAddress),
        senderAddressBase58: bs58EncodeRawAddress(this.header.sender),
        timestamp: this.header.timestamp,
        version: this.header.version
      },
      payload: this.payload
    }));
    return hash.digest();
  }

  public calculateTransactionId(): string {
    const hash = this.calculateHash();
    return transactionHashToId(hash);
  }
}

export function transactionHashToId(hash: Buffer) {
  return hash.toString("hex");
}
