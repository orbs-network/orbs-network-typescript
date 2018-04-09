import * as path from "path";

import { ErrorHandler, Service, topology } from "orbs-core-library";

import VirtualMachineServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/virtual-machine.log"));

const nodeTopology = topology();

VirtualMachineServer(nodeTopology, process.env)
  .onEndpoint(nodeTopology.endpoint)
  .start();
