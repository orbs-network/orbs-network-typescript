
import * as path from "path";

import { grpcServer, topologyPeers, KeyManager } from "orbs-core-library";
import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";
import * as _ from "lodash";

export default function(nodeTopology: any, env: any) {
    const { NODE_NAME, NODE_ENV, BLOCK_STORAGE_POLL_INTERVAL, BLOCK_STORAGE_DB_PATH, BLOCK_STORAGE_VERIFY_SIGNATURES, STATE_STORAGE_POLL_INTERVAL } = env;

    if (!NODE_NAME) {
        throw new Error("NODE_NAME can't be empty!");
    }

    const peers = topologyPeers(nodeTopology.peers);
    // TODO: this is very fragile - refactor to make this less hardcoded
    const blockStorageDBPath = BLOCK_STORAGE_DB_PATH || path.resolve(path.join("../../../db", NODE_ENV || "development") + "blocks.db");

    const verifySignature = _.lowerCase(BLOCK_STORAGE_VERIFY_SIGNATURES) === "true";
    const keyManager = verifySignature ? new KeyManager({
      privateKeyPath: "/opt/orbs/private-keys/block/secret-key",
      publicKeysPath: "/opt/orbs/public-keys/block"
    }) : undefined;

    const blockStorageConfig = {
      nodeName: NODE_NAME,
      dbPath: blockStorageDBPath,
      pollInterval: Number(BLOCK_STORAGE_POLL_INTERVAL) || 5000,
      verifySignature,
      keyManager
    };
    const stateStorageConfig = { nodeName: NODE_NAME, pollInterval: Number(STATE_STORAGE_POLL_INTERVAL) || 200 };

    return grpcServer.builder()
                     .withService("BlockStorage", new BlockStorageService(peers.gossip, peers.transactionPool, blockStorageConfig))
                     .withService("StateStorage", new StateStorageService(peers.blockStorage, stateStorageConfig));
}
