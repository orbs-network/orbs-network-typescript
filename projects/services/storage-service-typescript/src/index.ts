import * as path from "path";

import { logger, ErrorHandler, Service, topology } from "orbs-core-library";
import storageServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/storage.log"));

const nodeTopology = topology();

storageServer(nodeTopology, process.env)
  .onEndpoint(nodeTopology.endpoint)
  .start();