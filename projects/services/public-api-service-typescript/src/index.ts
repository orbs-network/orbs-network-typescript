import * as path from "path";

import { ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers, logger } from "orbs-core-library";

import PublicApiService from "./service";
import PublicApiHTTPService from "./http-service";

const { NODE_NAME } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/public-api.log"));

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = {
  nodeName: NODE_NAME
};

ServiceRunner.run(grpc.publicApiServer, new PublicApiService(peers.virtualMachine, peers.transactionPool, nodeConfig), nodeTopology.endpoint);

const httpNodeConfig = {
  nodeName: NODE_NAME,
  httpPort: 80
};

const httpService = new PublicApiHTTPService(peers.virtualMachine, peers.transactionPool, httpNodeConfig);
httpService.start();
