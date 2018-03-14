import * as path from "path";

import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import VirtualMachineService from "./service";

const { NODE_NAME, ETHEREUM_NODE_ADDRESS, LOGZIO_API_KEY, LOG_LEVEL } = process.env;

ErrorHandler.setup();

logger.configure({
  level: LOG_LEVEL,
  file: {
    fileName: path.join(__dirname, "../../../../logs/virtual-machine.log")
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
  console: true
});

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME, ethereumNodeHttpAddress: ETHEREUM_NODE_ADDRESS };

const main = async () => {
  await ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
};

ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
