import { ErrorHandler, grpc, topology } from "orbs-core-library";

import StorageService from "./service";

ErrorHandler.setup();

const server = grpc.storageServer({
  endpoint: topology().endpoint,
  service: new StorageService()
});
