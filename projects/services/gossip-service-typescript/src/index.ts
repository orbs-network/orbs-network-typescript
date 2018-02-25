import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, config } from "orbs-core-library";

import GossipService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const gossipConfig = { nodeName: config.getNodeName(), nodeIp: config.getNodeIP(), gossipPort: nodeTopology.gossipPort };
ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
