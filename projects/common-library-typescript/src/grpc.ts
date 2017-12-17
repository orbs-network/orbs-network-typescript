import * as path from "path";
import * as Mali from "mali";
import * as caller from "grpc-caller";
import { types } from "./types";

const PROTO_PATH = path.resolve(__dirname, "../../architecture/interfaces");

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

  export function chatterServer({ endpoint, service }: { endpoint: string, service: types.ChatterServer }) {
    server("chatter.proto", "Chatter", endpoint, service);
  }

  export function consensusServer({ endpoint, service }: { endpoint: string, service: types.ConsensusServer }) {
    server("consensus.proto", "Consensus", endpoint, service);
  }

  export function publicApiServer({ endpoint, service }: { endpoint: string, service: types.PublicApiServer }) {
    server("public-api.proto", "PublicApi", endpoint, service);
  }

  export function transactionPoolServer({ endpoint, service }: { endpoint: string, service: types.TransactionPoolServer }) {
    server("transaction-pool.proto", "TransactionPool", endpoint, service);
  }

  export function gossipServer({ endpoint, service }: { endpoint: string, service: types.GossipServer }) {
    server("gossip.proto", "Gossip", endpoint, service);
  }

  export function virtualMachineServer({ endpoint, service }: { endpoint: string, service: types.VirtualMachineServer }) {
    server("vm.proto", "VirtualMachine", endpoint, service);
  }

  export function chatterClient({ endpoint }: { endpoint: string }): types.ChatterClient {
    return client("chatter.proto", "Chatter", endpoint);
  }

  export function consensusClient({ endpoint }: { endpoint: string }): types.ConsensusClient {
    return client("consensus.proto", "Consensus", endpoint);
  }

  export function publicApiClient({ endpoint }: { endpoint: string }): types.PublicApiClient {
    return client("public-api.proto", "PublicApi", endpoint);
  }

  export function transactionPoolClient({ endpoint }: { endpoint: string }): types.TransactionPoolClient {
    return client("transaction-pool.proto", "TransactionPool", endpoint);
  }

  export function gossipClient({ endpoint }: { endpoint: string }): types.GossipClient {
    return client("gossip.proto", "Gossip", endpoint);
  }

  export function virtualMachineClient({ endpoint }: { endpoint: string }): types.VirtualMachineClient {
    return client("vm.proto", "VirtualMachine", endpoint);
  }

}
