import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, config } from "orbs-core-library";

import GossipService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: config.get("NODE_NAME"), gossipPort: nodeTopology.gossipPort,
peers, gossipPeers: nodeTopology.gossipPeers };

const main = async () => {
  await ServiceRunner.run(grpc.gossipServer, new GossipService(nodeConfig), nodeTopology.endpoint);
};

main();
