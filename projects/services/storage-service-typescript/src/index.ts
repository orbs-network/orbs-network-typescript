import * as path from "path";

import { logger, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

const { NODE_NAME, NODE_ENV, LOGZIO_API_KEY, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH } = process.env;

ErrorHandler.setup();

logger.configure({
  file: {
    fileName: path.join(__dirname, "../../../../logs/storage.log")
  },
  logzio: {
    apiKey: LOGZIO_API_KEY
  },
});

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const blockStorageDBPath = BLOCK_STORAGE_DB_PATH || path.resolve(path.join("../../../db", NODE_ENV || "development") + "blocks.db");

const blockStorageConfig = {
  nodeName: NODE_NAME,
  dbPath: blockStorageDBPath,
  pollInterval:
  Number(BLOCK_STORAGE_POLL_INTERVAL) || 5000
};

const stateStorageConfig = { nodeName: NODE_NAME };

ServiceRunner.runMulti(grpc.storageServiceServer, [
  new BlockStorageService(peers.gossip, blockStorageConfig),
  new StateStorageService(peers.blockStorage, stateStorageConfig)
], nodeTopology.endpoint);
