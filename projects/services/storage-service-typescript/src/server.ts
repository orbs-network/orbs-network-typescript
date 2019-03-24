/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


import * as path from "path";

import { grpcServer, topologyPeers, KeyManager } from "orbs-core-library";
import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";
import { StartupCheckRunner } from "orbs-core-library/dist/common-library/startup-check-runner";
import * as _ from "lodash";

export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, NODE_ENV, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH, BLOCK_STORAGE_VERIFY_SIGNATURES, STATE_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_BATCH_SIZE, BlOCK_STORAGE_BATCHES_PER_INTERVAL } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const peers = topologyPeers(nodeTopology.peers);
  // TODO: this is very fragile - refactor to make this less hardcoded
  const blockStorageDBPath = BLOCK_STORAGE_DB_PATH || path.resolve(path.join("../../../db", NODE_ENV || "development") + "blocks.db");

  const verifySignature = _.lowerCase(BLOCK_STORAGE_VERIFY_SIGNATURES) === "true";
  const keyManager = verifySignature ? new KeyManager({
    publicKeysPath: "/opt/orbs/public-keys/block"
  }) : undefined;

  const blockStorageConfig = {
    nodeName: NODE_NAME,
    dbPath: blockStorageDBPath,
    pollInterval: Number(BLOCK_STORAGE_POLL_INTERVAL) || 5000,
    batchSize: Number(BLOCK_STORAGE_BATCH_SIZE) || 1000,
    batchesPerInterval: Number(BlOCK_STORAGE_BATCHES_PER_INTERVAL) || 20,
    verifySignature,
    keyManager
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
