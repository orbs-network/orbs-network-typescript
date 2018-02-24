import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, config } from "orbs-core-library";

import GossipService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const main = async () => {
  const gossipConfig = { nodeName: config.getNodeName(), nodeIp: config.get("NODE_IP"), gossipPort: nodeTopology.gossipPort };
  await ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
};

main();
