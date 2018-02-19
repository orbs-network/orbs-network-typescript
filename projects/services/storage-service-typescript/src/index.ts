import { ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.runMulti(grpc.storageServiceServer, [
    new BlockStorageService(),
    new StateStorageService()
  ]);
};

main();
