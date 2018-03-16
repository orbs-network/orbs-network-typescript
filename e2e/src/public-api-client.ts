import * as path from "path";
import * as caller from "grpc-caller";
import { PublicApiClient, getPathToProto } from "orbs-interfaces";

export interface GRPCClient {
  proto: string;
  name: string;
  endpoint: string;
}

function client(grpc: GRPCClient) {
  return caller(grpc.endpoint, getPathToProto(grpc.proto), grpc.name);
}

export function initPublicApiClient({ endpoint }: { endpoint: string }): PublicApiClient {
  return client({ proto: "public-api.proto", name: "PublicApi", endpoint });
}
