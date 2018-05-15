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
