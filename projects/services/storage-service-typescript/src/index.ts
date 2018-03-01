import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

import { parseInt } from "lodash";

ErrorHandler.setup();

const { BLOCK_STORAGE_POLL_INTERVAL } = process.env;

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = {
  nodeName: nodeTopology.name,
  pollInterval: parseInt(BLOCK_STORAGE_POLL_INTERVAL) || 5000
};

const main = async () => {
  await ServiceRunner.runMulti(grpc.storageServiceServer, [
    new BlockStorageService(peers.gossip, nodeConfig),
    new StateStorageService(peers.blockStorage, nodeConfig)
  ], nodeTopology.endpoint);
};

main();
