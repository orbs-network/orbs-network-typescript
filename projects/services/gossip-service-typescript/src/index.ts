import * as path from "path";

import { logger, ErrorHandler, Service, topology } from "orbs-core-library";

import gossipServer from "./server";

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/gossip.log"));

const nodeTopology = topology();
gossipServer(topology, process.env);