import { ErrorHandler, grpc, topology } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const nodeTopology = topology();

const main = async () => {
  const blockStorageService = new BlockStorageService();
  await blockStorageService.start();

  const stateStorageService = new StateStorageService();

  grpc.storageServiceServer({
    endpoint: nodeTopology.endpoint,
    services: [blockStorageService, stateStorageService]
  });
};

main();
