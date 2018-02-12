import * as path from "path";
import * as Mali from "mali";
import * as caller from "grpc-caller";
import { types } from "./types";

const PROTO_PATH = path.resolve(__dirname, "../../../../architecture/interfaces");

export interface GRPCClient {
  proto: string;
  name: string;
  endpoint: string;
}

export interface GRPServer {
  proto: string;
  name: string;
  service: any;
  endpoint: string;
}

export interface GRPServers {
  multiProto: string;
  names: string[];
  services: any[];
  endpoint: string;
}

function client(grpc: GRPCClient) {
  const protoPath = path.resolve(PROTO_PATH, grpc.proto);
  return caller(grpc.endpoint, protoPath, grpc.name);
}

function server(grpc: GRPServer) {
  const protoPath = path.resolve(PROTO_PATH, grpc.proto);
  const app = new Mali(protoPath, grpc.name);
  const serviceFuncs: {[key: string]: Function} = {};
  for (const funcName of (<any>types)[grpc.name]) {
    serviceFuncs[funcName] = (grpc.service)[funcName];
  }

  app.use(serviceFuncs);
  app.start(grpc.endpoint);
}

function servers(grpcs: GRPServers) {
  const protoPath = path.resolve(PROTO_PATH, grpcs.multiProto);
  const app = new Mali(protoPath, grpcs.names);

  const serviceFuncs: { [key: string]: Function } = {};

  for (let i = 0; i < grpcs.names.length; ++i) {
    const name = grpcs.names[i];
    const service = grpcs.services[i];
    for (const funcName of (<any>types)[name]) {
      serviceFuncs[funcName] = (service)[funcName];
    }
  }

  app.use(serviceFuncs);
  app.start(grpcs.endpoint);
}

export namespace grpc {
  export function gossipServer({ endpoint, service }: { endpoint: string, service: types.GossipServer }) {
    server({
      proto: "gossip.proto",
      name: "Gossip",
      endpoint,
      service
    });
  }

  export function gossipClient({ endpoint }: { endpoint: string }): types.GossipClient {
    return client({
      proto: "gossip.proto",
      name: "Gossip",
      endpoint
    });
  }

  export function storageServer({ endpoint, service }: { endpoint: string, service: types.StorageServer }) {
    return server({ proto: "storage.proto", name: "Storage", endpoint, service });
  }

  export function storageClient({ endpoint }: { endpoint: string }): types.StorageClient {
    return client({ proto: "storage.proto", name: "Storage", endpoint });
  }

  export function consensusServiceServer({ endpoint, services }: {
    endpoint: string, services: [types.ConsensusServer, types.SubscriptionManagerServer, types.TransactionPoolServer]
  }) {
    servers({
      multiProto: "consensus-service.proto",
      names: ["Consensus", "SubscriptionManager"],
      endpoint,
      services
    });
  }

  export function consensusServer({ endpoint, service }: { endpoint: string, service: types.ConsensusServer }) {
    server({
      proto: "consensus.proto",
      name: "Consensus",
      endpoint,
      service
    });
  }

  export function consensusClient({ endpoint }: { endpoint: string }): types.ConsensusClient {
    return client({ proto: "consensus.proto", name: "Consensus", endpoint });
  }

  export function subscriptionManagerServer({ endpoint, service }: { endpoint: string, service: types.SubscriptionManagerServer }) {
    server({ proto: "subscription-manager.proto", name: "SubscriptionManager", endpoint, service });
  }

  export function subscriptionManagerClient({ endpoint }: { endpoint: string }): types.SubscriptionManagerClient {
    return client({ proto: "subscription-manager.proto", name: "SubscriptionManager", endpoint });
  }

  export function publicApiServer({ endpoint, service }: { endpoint: string, service: types.PublicApiServer }) {
    server({ proto: "public-api.proto", name: "PublicApi", endpoint, service });
  }

  export function publicApiClient({ endpoint }: { endpoint: string }): types.PublicApiClient {
    return client({ proto: "public-api.proto", name: "PublicApi", endpoint });
  }

  export function virtualMachineServer({ endpoint, service }: { endpoint: string, service: types.VirtualMachineServer }) {
    server({ proto: "virtual-machine.proto", name: "VirtualMachine", endpoint, service });
  }

  export function virtualMachineClient({ endpoint }: { endpoint: string }): types.VirtualMachineClient {
    return client({ proto: "virtual-machine.proto", name: "VirtualMachine", endpoint });
  }

  export function sidechainConnectorServer({ endpoint, service }: { endpoint: string, service: types.SidechainConnectorServer }) {
    server({ proto: "sidechain-connector.proto", name: "SidechainConnector", endpoint, service });
  }

  export function sidechainConnectorClient({ endpoint }: { endpoint: string }): types.SidechainConnectorClient {
    return client({ proto: "sidechain-connector.proto", name: "SidechainConnector", endpoint });
  }
}
