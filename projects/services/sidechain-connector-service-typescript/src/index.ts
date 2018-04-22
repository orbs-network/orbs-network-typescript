import * as path from "path";

import { logger, ErrorHandler, Service, topology } from "orbs-core-library";
import sidechainConnectorServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/sidechain-connector.log"));

const nodeTopology = topology();

sidechainConnectorServer(nodeTopology, process.env)
    .onEndpoint(nodeTopology.endpoint)
    .start();
