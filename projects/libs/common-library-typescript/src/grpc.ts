import * as path from "path";
import * as Mali from "mali";
import * as caller from "grpc-caller";
import { types } from "./types";

const PROTO_PATH = path.resolve(__dirname, "../../../architecture/interfaces");

function client(proto: string, name: string, endpoint: string) {
  const protoPath = path.resolve(PROTO_PATH, proto);
  return caller(endpoint, protoPath, name);
}

function server(proto: string, name: string, endpoint: string, service: any) {
  const protoPath = path.resolve(PROTO_PATH, proto);
  const app = new Mali(protoPath, name);
  const serviceFuncs: {[key: string]: Function} = {};
  for (const funcName of (<any>types)[name]) {
    serviceFuncs[funcName] = (service)[funcName];
  }
  app.use(serviceFuncs);
  app.start(endpoint);
}

export namespace grpc {
  export function storageServer({ endpoint, service }: { endpoint: string, service: types.StorageServer }) {
    return server("storage.proto", "Storage", endpoint, service);
  }

  export function storageClient({ endpoint }: { endpoint: string }): types.StorageClient {
    return client("state-storage.proto", "StateStorage", endpoint);
  }

  export function consensusServer({ endpoint, service }: { endpoint: string, service: types.ConsensusServer }) {
    server("consensus.proto", "Consensus", endpoint, service);
  }

  export function consensusClient({ endpoint }: { endpoint: string }): types.ConsensusClient {
    return client("consensus.proto", "Consensus", endpoint);
  }

  export function publicApiServer({ endpoint, service }: { endpoint: string, service: types.PublicApiServer }) {
    server("public-api.proto", "PublicApi", endpoint, service);
  }

  export function virtualMachineServer({ endpoint, service }: { endpoint: string, service: types.VirtualMachineServer }) {
    server("virtual-machine.proto", "VirtualMachine", endpoint, service);
  }

  export function sidechainConnectorServer({ endpoint, service }: { endpoint: string, service: types.SidechainConnectorServer }) {
      server("sidechain-connector.proto", "SidechainConnector", endpoint, service);
  }

  export function publicApiClient({ endpoint }: { endpoint: string }): types.PublicApiClient {
    return client("public-api.proto", "PublicApi", endpoint);
  }

  export function virtualMachineClient({ endpoint }: { endpoint: string }): types.VirtualMachineClient {
    return client("virtual-machine.proto", "VirtualMachine", endpoint);
  }

  export function sidechainConnectorClient({ endpoint }: { endpoint: string }): types.SidechainConnectorClient {
      return client("sidechain-connector.proto", "SidechainConnector", endpoint);
  }
}
