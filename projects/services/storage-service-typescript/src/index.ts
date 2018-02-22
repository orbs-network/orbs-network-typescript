import { ErrorHandler, grpc, ServiceRunner, topology, topologyPeers } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const nodeConfig = { nodeName: nodeTopology.name };

const main = async () => {
  await ServiceRunner.runMulti(grpc.storageServiceServer, [
    new BlockStorageService(peers.gossip, nodeConfig),
    new StateStorageService(peers.blockStorage, nodeConfig)
  ], nodeTopology.endpoint);
};

main();
