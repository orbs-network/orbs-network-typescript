
import * as path from "path";

import { grpcServer, topologyPeers } from "orbs-core-library";
import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";
import { StartupCheckRunner } from "orbs-core-library/dist/common-library/startup-check-runner";

export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, NODE_ENV, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH, STATE_STORAGE_POLL_INTERVAL } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const peers = topologyPeers(nodeTopology.peers);
  // TODO: this is very fragile - refactor to make this less hardcoded
  const blockStorageDBPath = BLOCK_STORAGE_DB_PATH || path.resolve(path.join("../../../db", NODE_ENV || "development") + "blocks.db");
  const blockStorageConfig = {
    nodeName: NODE_NAME,
    dbPath: blockStorageDBPath,
    pollInterval: Number(BLOCK_STORAGE_POLL_INTERVAL) || 5000
  };
  const stateStorageConfig = { nodeName: NODE_NAME, pollInterval: Number(STATE_STORAGE_POLL_INTERVAL) || 200 };
  const blockStorageService = new BlockStorageService(peers.gossip, peers.transactionPool, blockStorageConfig);
  const stateStorageService = new StateStorageService(peers.blockStorage, stateStorageConfig);
  const startupCheckRunner = new StartupCheckRunner("storage", [blockStorageService, stateStorageService]);


  return grpcServer.builder()
    .withService("BlockStorage", blockStorageService)
    .withService("StateStorage", stateStorageService)
    .withStartupCheckRunner(startupCheckRunner)
    .withManagementPort(8081);
}
