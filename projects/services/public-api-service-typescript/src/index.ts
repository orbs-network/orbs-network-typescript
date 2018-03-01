import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, logger } from "orbs-core-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const { NODE_NAME, LOGZIO_API_KEY } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/public-api.log"
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME };

ServiceRunner.run(grpc.publicApiServer, new PublicApiService(peers.virtualMachine, peers.consensus, peers.subscriptionManager, nodeConfig), nodeTopology.endpoint);
