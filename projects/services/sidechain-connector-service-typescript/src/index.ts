import { config, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import SidehainConnectorService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name, ethereumNodeHttpAddress: config.get("ethereumNodeAddress") };

const main = async () => {
  await ServiceRunner.run(grpc.sidechainConnectorServer, new SidehainConnectorService(nodeConfig), nodeTopology.endpoint);
};

main();
