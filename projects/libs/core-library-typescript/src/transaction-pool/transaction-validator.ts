/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { types, Address, logger, TransactionHelper } from "..";
import { eddsa } from "elliptic";
const ec = new eddsa("ed25519");


export interface TransactionValidatorOptions {
  verifySignature: boolean;
  verifySubscription: boolean;
}

export class TransactionValidator {
  subscriptionManager: types.SubscriptionManagerClient;
  options: TransactionValidatorOptions;

  public async validate(tx: types.Transaction): Promise<boolean> {
    if (tx.header.version !== 0) {
      throw new Error(`Invalid transaction version: ${tx.header.version}`);
    }

    if ((this.options.verifySignature) && (!this.verifySignature(tx))) {
      logger.info(`Signature of ${JSON.stringify(tx)} is invalid`);
      return false;
    }

    // deserializes addresses and validate checksums
    const senderAddress = Address.fromBuffer(tx.header.sender, tx.signatureData.publicKey, true);
    if (senderAddress == undefined) {
      logger.info(`Sender address validation ${tx.header.sender.toJSON().data} failed on deserialization (fromBuffer())`);
      return false;
    }
    const contractAddress = Address.fromBuffer(tx.header.contractAddress, undefined, true);
    if (contractAddress == undefined) {
      logger.info(`Contract address validation ${tx.header.contractAddress.toJSON().data} failed on deserialization (fromBuffer())`);
      return false;
    }

    // check that virtual chains of sender and contract match
    if (senderAddress.virtualChainId != contractAddress.virtualChainId) {
      logger.info(`Virtual chain of address and contract address should match ${senderAddress.virtualChainId} != ${contractAddress.virtualChainId}`);
      return false;
    }

    if (!this.options.verifySubscription) {
      return true;
    }

    // checks subscription
    const subscriptionKey = this.getSubscriptionKey(contractAddress);
    const status = await this.subscriptionManager.isSubscriptionValid({ subscriptionKey });

    if (!status.isValid) {
      logger.info(`Subscription ${subscriptionKey} not valid`);
    }

    return status.isValid;
  }

  private verifySignature(tx: types.Transaction) {
    const txHelper = new TransactionHelper(tx);
    const hash = txHelper.calculateHash();
    const key = ec.keyFromPublic(tx.signatureData.publicKey.toString("hex"));
    return key.verify(hash, tx.signatureData.signature.toString("hex"));
  }

  private getSubscriptionKey(contractAddress: Address): string {
    // we create a subscription key by zero-left-padding the contract's vchain ID
    const subscriptionKey = "0x0000000000000000000000000000000000000000000000000000000000" + contractAddress.virtualChainId;
    return subscriptionKey;
  }

  constructor(subscriptionManager: types.SubscriptionManagerClient, options: TransactionValidatorOptions) {
    this.subscriptionManager = subscriptionManager;
    this.options = options;
  }
}
