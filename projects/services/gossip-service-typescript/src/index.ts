import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers, KeyManager } from "orbs-core-library";

import GossipService from "./service";
import gossipServer from "./server";

const { NODE_NAME, SIGN_MESSAGES } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/gossip.log"));

const nodeTopology = topology();
gossipServer(topology, process.env);