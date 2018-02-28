import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import GossipService from "./service";

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/gossip.log"
  },
});

ErrorHandler.setup();

const { NODE_NAME, NODE_IP } = process.env;

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
