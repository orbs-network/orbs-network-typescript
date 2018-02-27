import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, logger } from "orbs-core-library";

import PublicApiService from "./service";

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/public-api.log"
  },
});

ErrorHandler.setup();

const { NODE_NAME } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME };

ServiceRunner.run(grpc.publicApiServer, new PublicApiService(peers.virtualMachine, peers.consensus, peers.subscriptionManager, nodeConfig), nodeTopology.endpoint);
