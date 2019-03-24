/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export interface OrbsAPISendTransactionRequest {
  header: {
    version: number,
    senderAddressBase58: string,
    timestamp: string,
    contractAddressBase58: string
  };
  payload: string;
  signatureData: {
    publicKeyHex: string;
    signatureHex: string;
  };
}

export interface OrbsAPICallContractRequest {
  senderAddressBase58: string;
  contractAddressBase58: string;
  payload: string;
}

export interface OrbsAPIGetTransactionStatusRequest {
  txid: string;
}

export interface OrbsAPITransactionReceipt {
  success: boolean;
}

export interface OrbsAPIGetTransactionStatusResponse {
  status: string;
  receipt?: OrbsAPITransactionReceipt;
}
