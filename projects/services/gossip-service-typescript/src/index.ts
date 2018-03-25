import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import GossipService from "./service";

const { NODE_NAME } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/gossip.log"));

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
