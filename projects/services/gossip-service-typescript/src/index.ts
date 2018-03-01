import * as path from "path";

import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import GossipService from "./service";

const { NODE_NAME, NODE_IP, LOGZIO_API_KEY } = process.env;

ErrorHandler.setup();

logger.configure({
  file: {
    fileName: path.join(__dirname, "../../../../logs/gossip.log")
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

if (!NODE_IP) {
  throw new Error("NODE_IP can't be empty!");
}


const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const gossipConfig = {
  nodeName: NODE_NAME,
  nodeIp: NODE_IP,
  gossipPort: nodeTopology.gossipPort,
  peers,
  gossipPeers: nodeTopology.gossipPeers
};

ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
