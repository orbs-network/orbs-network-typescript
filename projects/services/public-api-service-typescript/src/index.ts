import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name };

ServiceRunner.run(grpc.publicApiServer, new PublicApiService(peers.virtualMachine, peers.consensus, peers.subscriptionManager, nodeConfig), nodeTopology.endpoint);
