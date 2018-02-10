import { ErrorHandler, topology, grpc } from "orbs-common-library";

import StorageService from "./service";

ErrorHandler.setup();

const server = grpc.storageServer({
  endpoint: topology.endpoint,
  service: new StorageService()
});
