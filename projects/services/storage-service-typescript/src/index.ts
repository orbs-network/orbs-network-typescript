import * as path from "path";

import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const { NODE_NAME, NODE_ENV, LOGZIO_API_KEY } = process.env;

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

logger.configure({
  file: {
    fileName: __dirname + "../../../../logs/storage.log"
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const blockStorageDBPath = path.resolve(path.join("../../../db", NODE_ENV || "development") + "blocks.db");

ServiceRunner.runMulti(grpc.storageServiceServer, [
  new BlockStorageService(peers.gossip, { nodeName: NODE_NAME, dbPath: blockStorageDBPath }),
  new StateStorageService(peers.blockStorage, { nodeName: NODE_NAME })
], nodeTopology.endpoint);
