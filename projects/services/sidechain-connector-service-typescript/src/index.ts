import { config, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import SidehainConnectorService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: config.getNodeName(), ethereumNodeHttpAddress: config.get("ethereumNodeAddress") };

ServiceRunner.run(grpc.sidechainConnectorServer, new SidehainConnectorService(nodeConfig), nodeTopology.endpoint);
