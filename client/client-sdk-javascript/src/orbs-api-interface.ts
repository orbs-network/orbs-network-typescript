export interface OrbsAPISendTransactionRequest {
  header: {
    version: number,
    senderAddressBase58: string,
    timestamp: string,
    contractAddressBase58: string
  };
  payload: string;
}

export interface OrbsAPICallContractRequest {
  senderAddressBase58: string;
  contractAddressBase58: string;
  payload: string;
}

export interface OrbsAPIGetTransactionStatusRequest {
  txid: string;
}
