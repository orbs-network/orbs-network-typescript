/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types } from "../common-library/types";
import  { Address } from "../common-library/address";
import { createHash } from "crypto";
import { TransactionHelper } from "..";
import { eddsa } from "elliptic";
const ec = new eddsa("ed25519");

export function aDummyTransaction(overrides: {
  timestamp?: number
} = {}) {
  const privateKey = "3f81e53116ee3f860c154d03b9cabf8af71d8beec210c535ed300c0aee5fcbe7";
  const key = ec.keyFromSecret(privateKey);
  const publicKey = Buffer.from("b9a91acbf23c22123a8253cfc4325d7b4b7a620465c57f932c7943f60887308b", "hex");

  const transaction: types.Transaction =  {
    header: {
      version: 0,
      sender: new Address(publicKey).toBuffer(),
      timestamp: (overrides.timestamp == undefined ? Date.now() : overrides.timestamp).toString(),
      contractAddress: Address.createContractAddress("dummyContract").toBuffer()
    },
    payload: "{}",
    signatureData: undefined
  };
  const transactionHash = new TransactionHelper(transaction).calculateHash();
  transaction.signatureData = {
    signature: Buffer.from(key.sign([...transactionHash]).toBytes()),
    publicKey
  };
  return transaction;
}

export function aDummyTransactionSet(numberOfTransactions = 3): types.Transaction[] {
  const transactions: types.Transaction[] = [];
  for (let i = 0; i < numberOfTransactions; i++) {
    const transaction = aDummyTransaction();
    const txHash = new TransactionHelper(transaction).calculateHash();
    transactions.push(transaction);
  }

  return transactions;
}
