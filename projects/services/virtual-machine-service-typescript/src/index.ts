import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import VirtualMachineService from "./service";

const { NODE_NAME, ETHEREUM_NODE_HTTP_ADDRESS } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/virtual-machine.log"));

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME, ethereumNodeHttpAddress: ETHEREUM_NODE_HTTP_ADDRESS };

const main = async () => {
  await ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
};

ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
