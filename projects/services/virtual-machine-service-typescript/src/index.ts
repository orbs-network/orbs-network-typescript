import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import VirtualMachineService from "./service";

ErrorHandler.setup();

const { NODE_NAME, ETHEREUM_NODE_ADDRESS, LOGZIO_API_KEY } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/virtual-machine.log"
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME, ethereumNodeHttpAddress: ETHEREUM_NODE_ADDRESS };

ServiceRunner.run(grpc.virtualMachineServer, new VirtualMachineService(peers.stateStorage, nodeConfig), nodeTopology.endpoint);
