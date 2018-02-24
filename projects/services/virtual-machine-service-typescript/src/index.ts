import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers, config } from "orbs-core-library";

import VirtualMachineService from "./service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: config.getNodeName(), ethereumNodeHttpAddress: config.get("ethereumNodeAddress") };

const main = async () => {
  await ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
};

main();
