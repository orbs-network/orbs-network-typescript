import * as path from "path";

import { config, ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);

const blockStorageDBPath = path.resolve(path.join("../../../db", config.getEnvironment()) + "blocks.db");
const nodeConfig = { nodeName: config.getNodeName() };
const blockStorageConfig = { nodeName: config.getNodeName(), dbPath: blockStorageDBPath };

ServiceRunner.runMulti(grpc.storageServiceServer, [
  new BlockStorageService(blockStorageConfig),
  new StateStorageService(peers.blockStorage, nodeConfig)
], nodeTopology.endpoint);
