import * as path from "path";
import * as caller from "grpc-caller";
import { PublicApiClient, getPathToProto, SendTransactionInput, SendTransactionOutput, CallContractInput, CallContractOutput } from "orbs-interfaces";
import PublicApiConnection from "./public-api-connection";

class PublicApiGrpcConnection implements PublicApiConnection {
  readonly publicApiClient: PublicApiClient;

  constructor(publicApiClient: PublicApiClient) {
    this.publicApiClient = publicApiClient;
  }

  sendTransaction(sendTransactionInput: SendTransactionInput): SendTransactionOutput {
    return this.publicApiClient.sendTransaction(sendTransactionInput);
  }

  callContract(callContractInput: CallContractInput): CallContractOutput {
    return this.publicApiClient.callContract(callContractInput);
  }

  async close() {
  }
}

export function createConnection({ endpoint }: { endpoint: string }): PublicApiConnection {
  const publicApiClient =  caller(endpoint, getPathToProto("public-api.proto"), "PublicApi");
  return new PublicApiGrpcConnection(publicApiClient);
}
