import * as Mali from "mali";
import * as path from "path";

import { types } from "./types";
import { Service } from "../base-service/service";
import { getPathToProto } from "orbs-interfaces";

const protos: Map<string, string> = new Map<string, string>();
protos.set("Consensus", "consensus.proto");
protos.set("SubscriptionManager", "subscription-manager.proto");
protos.set("TransactionPool", "transaction-pool.proto");
protos.set("Gossip", "gossip.proto");
protos.set("BlockStorage", "block-storage.proto");
protos.set("StateStorage", "state-storage.proto");
protos.set("PublicApi", "public-api.proto");
protos.set("VirtualMachine", "virtual-machine.proto");
protos.set("SidechainConnector", "sidechain-connector.proto");
protos.set("Management", "management.proto");

export class GRPCServerBuilder {
  endpoint: string;
  mali: Mali;
  services: Service[] = [];

  onEndpoint(endpoint: string): GRPCServerBuilder {
    this.endpoint = endpoint;

    return this;
  }

  withService<T extends Service>(name: string, impl: T): GRPCServerBuilder {
    const proto = protos.get(name);
    const protoPath = getPathToProto(proto);

    if (this.mali) {
      this.mali.addService(protoPath, name);
    } else {
      this.mali = new Mali(protoPath, name);
    }

    const serviceFuncs: { [key: string]: { [key: string]: Function } } = {};
    serviceFuncs[name] = {};

    for (const funcName of (<any>types)[name]) {
      serviceFuncs[name][funcName] = (<any>impl)[funcName];
    }

    this.mali.use(serviceFuncs, name);

    this.services.push(impl);

    return this;
  }

  start(): Promise<any> {
    const all = Promise.all(this.services.map(s => s.start()));

    this.mali.start(this.endpoint);

    return all;
  }

}

export namespace grpcServer {
  export function builder() {
    return new GRPCServerBuilder();
  }
}
