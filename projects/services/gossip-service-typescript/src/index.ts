import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import GossipService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name, gossipPort: nodeTopology.gossipPort };

const main = async () => {
  await ServiceRunner.run(grpc.gossipServer, new GossipService(nodeConfig), nodeTopology.endpoint);
};

main();
