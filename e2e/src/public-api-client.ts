import * as path from "path";
import * as caller from "grpc-caller";

const PROTO_PATH = path.resolve(__dirname, "../../projects/architecture/interfaces");

export interface GRPCClient {
  proto: string;
  name: string;
  endpoint: string;
}


export interface Transaction {
    sender: string;
    contractAddress: string;
    payload: string;
    signature: string;
}

export interface TransactionAppendix {
    prefetchAddresses: string[];
    subscriptionKey: string;
}

interface PublicApiSendTransactionInput {
    transaction: Transaction;
    transactionAppendix: TransactionAppendix;
}

interface PublicApiSendTransactionOutput {
}

interface PublicApiCallInput {
    sender: string;
    contractAddress: string;
    payload: string;
}

export interface PublicApiCallOutput {
    resultJson: string;
}

export interface PublicApiClient {
    sendTransaction(publicApiSendTransactionInput: PublicApiSendTransactionInput): PublicApiSendTransactionOutput;
    call(publicApiCallInput: PublicApiCallInput): PublicApiCallOutput;
}

function client(grpc: GRPCClient) {
  const protoPath = path.resolve(PROTO_PATH, grpc.proto);
  return caller(grpc.endpoint, protoPath, grpc.name);

}

export function initPublicApiClient({ endpoint }: { endpoint: string }): PublicApiClient {
    return client({ proto: "public-api.proto", name: "PublicApi", endpoint });
}
