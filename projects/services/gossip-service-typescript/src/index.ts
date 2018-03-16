import * as path from "path";

import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import GossipService from "./service";

const { NODE_NAME, LOGZIO_API_KEY, LOG_LEVEL } = process.env;

ErrorHandler.setup();

logger.configure({
  level: LOG_LEVEL,
  file: {
    fileName: path.join(__dirname, "../../../../logs/gossip.log")
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

const gossipConfig = {
  nodeName: NODE_NAME,
  gossipPort: nodeTopology.gossipPort,
  peers,
  gossipPeers: nodeTopology.gossipPeers
};

ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
