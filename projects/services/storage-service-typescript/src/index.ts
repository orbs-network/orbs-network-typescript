import { ErrorHandler, grpc, topology } from "orbs-core-library";

import BlockStorageService from "./block-storage-service";
import StateStorageService from "./state-storage-service";

ErrorHandler.setup();

const nodeTopology = topology();

grpc.storageServiceServer({
  endpoint: nodeTopology.endpoint,
  services: [new BlockStorageService(), new StateStorageService()]
});
