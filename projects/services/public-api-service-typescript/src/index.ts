import * as path from "path";

import { ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers, logger } from "orbs-core-library";

import PublicApiService from "./service";
import PublicApiHTTPService from "./http-service";
import httpServer from "./server";

const { NODE_NAME } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/public-api.log"));

const nodeTopology = topology();
httpServer(nodeTopology, process.env).start();
