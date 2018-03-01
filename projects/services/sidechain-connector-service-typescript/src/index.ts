import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import SidehainConnectorService from "./service";

ErrorHandler.setup();

const { NODE_NAME, ETHEREUM_NODE_HTTP_ADDRESS, LOGZIO_API_KEY } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

if (!ETHEREUM_NODE_HTTP_ADDRESS) {
  throw new Error("ETHEREUM_NODE_HTTP_ADDRESS can't be empty!");
}

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/sidechain-connector.log"
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: NODE_NAME, ethereumNodeHttpAddress: ETHEREUM_NODE_HTTP_ADDRESS };

ServiceRunner.run(grpc.sidechainConnectorServer, new SidehainConnectorService(nodeConfig), nodeTopology.endpoint);
