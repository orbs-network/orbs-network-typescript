import * as path from "path";

import { logger, ErrorHandler, topology, Service } from "orbs-core-library";

import consensusServer from "./consensus-server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/consensus.log"));

const nodeTopology = topology();

consensusServer(nodeTopology, process.env)
  .onEndpoint(nodeTopology.endpoint)
  .start();
