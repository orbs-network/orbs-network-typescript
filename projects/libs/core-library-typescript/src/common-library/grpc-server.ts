import * as Mali from "mali";
import * as express from "express";
import { Request, Response } from "express";
import { StartupCheck } from "./startup-check";
import { STARTUP_STATUS, StartupStatus } from "./startup-status";
import { StartupCheckRunner } from "./startup-check-runner";

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

const DEFAULT_MANAGEMENT_PORT = 8081;

export class GRPCServerBuilder {
  managementPort: number = DEFAULT_MANAGEMENT_PORT;
  endpoint: string;
  mali: Mali;
  services: Service[] = [];
  managementServer: any;
  startupCheckRunner: StartupCheckRunner;

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

  withStartupCheckRunner(startupCheckRunner: StartupCheckRunner) {
    this.startupCheckRunner = startupCheckRunner;
    return this;
  }



  start(): Promise<any> {


    if (!this.endpoint) {
      return Promise.reject("No endpoint defined, you must call onEndpoint() before starting");
    }

    if (!this.managementPort) {
      return Promise.reject("No management port defined, you must call withManagementPort() before starting");
    }

    if (!this.mali) {
      return Promise.reject("Mali was not set up correctly. did you forget to call withService()?");
    }

    const startupCheckers: StartupCheck[] = [];
    this.services.forEach(s => {

      if (this.instanceOfStartupChecker(s)) {
        startupCheckers.push(<StartupCheck>s);
      }
    });

    const app = express();
    app.get("/admin/startupCheck", (req: Request, res: Response) => {
      this.startupCheckRunner.run()
        .then((result: StartupStatus) => {
          const httpCode = result.status === STARTUP_STATUS.OK ? 200 : 503;
          return res.status(httpCode).send(result);
        });
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

    const all = Promise.all(this.services.map(s => s.stop()));
    if (this.mali) {
      this.mali.close(this.endpoint);
    }
    if (this.managementServer) {
      this.managementServer.close();
    }
    return all;
  }

  private instanceOfStartupChecker(item: any): item is StartupCheck {
    return "checkStartupStatus" in item;
  }
}

export namespace grpcServer {
  export function builder() {
    return new GRPCServerBuilder();
  }
}
