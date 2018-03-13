import * as path from "path";

import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, logger } from "orbs-core-library";

import PublicApiService from "./service";

const { NODE_NAME, LOGZIO_API_KEY, VALIDATE_SUBSCRIPTION } = process.env;

ErrorHandler.setup();

logger.configure({
  file: {
    fileName: path.join(__dirname, "../../../../logs/public-api.log")
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
  console: true
});

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const validateSubscription = VALIDATE_SUBSCRIPTION === "true";
const nodeConfig = {
  nodeName: NODE_NAME,
  validateSubscription
};

ServiceRunner.run(grpc.publicApiServer, new PublicApiService(peers.virtualMachine, peers.transactionPool, peers.subscriptionManager, nodeConfig), nodeTopology.endpoint);
