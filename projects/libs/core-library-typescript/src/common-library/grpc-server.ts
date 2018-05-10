import * as Mali from "mali";
import * as express from "express";
import { Request, Response } from "express";
import { StartupCheckResult } from "./startup-check-result";

import { types } from "./types";
import { Service } from "../base-service";
import { getPathToProto } from "orbs-interfaces";

import { filter } from "lodash";
import { logger } from ".";

const protos: Map<string, string> = new Map<string, string>();
protos.set("Consensus", "consensus.proto");
protos.set("SubscriptionManager", "subscription-manager.proto");
protos.set("TransactionPool", "transaction-pool.proto");
protos.set("Gossip", "gossip.proto");
protos.set("BlockStorage", "block-storage.proto");
protos.set("StateStorage", "state-storage.proto");
protos.set("VirtualMachine", "virtual-machine.proto");
protos.set("SidechainConnector", "sidechain-connector.proto");
protos.set("Management", "management.proto");

export class GRPCServerBuilder {
  managementPort: number;
  endpoint: string;
  mali: Mali;
  services: Service[] = [];
  managementServer: any;

  onEndpoint(endpoint: string): GRPCServerBuilder {
    this.endpoint = endpoint;

    return this;
  }

  withManagementPort(managementPort: number): GRPCServerBuilder {
    this.managementPort = managementPort;
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



    // check if no endpoint...
    if (!this.mali) {
      return Promise.reject("Mali was not set up correctly. did you forget to call withService()?");
    }

    const app = express();
    logger.info("Management server is starting");
    app.get("/admin/startupCheck", (req: Request, res: Response) => {



      return res.json({ status: "ok" });
    });

    return new Promise(resolve => {
      this.managementServer = app.listen(this.managementPort, resolve);
    })
      .then(() => {
        const all = Promise.all(this.services.map(s => s.start()));
        this.mali.start(this.endpoint);
        return all;


      });
  }

  stop(): Promise<any> {

    // return new Promise(resolve => {
    //   return this.managementServer ? this.managementServer.close(resolve) : resolve();
    // })
    //   .then(() => {
    const all = Promise.all(this.services.map(s => s.stop()));
    if (this.mali) {
      this.mali.close(this.endpoint);
    }
    if (this.managementServer) {
      logger.info("Management server is stopping");
      this.managementServer.close();
    }
    return all;
    // });
  }
}

export namespace grpcServer {
  export function builder() {
    return new GRPCServerBuilder();
  }
}
