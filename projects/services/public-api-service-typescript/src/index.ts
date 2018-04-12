import * as path from "path";

import { ErrorHandler, Service, topology, logger } from "orbs-core-library";
import httpServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/public-api.log"));

const nodeTopology = topology();
httpServer(nodeTopology, process.env).start();
