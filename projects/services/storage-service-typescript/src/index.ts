import { ErrorHandler, topology, grpc } from "orbs-core-library/dist/common-library";

import StorageService from "./service";

ErrorHandler.setup();

const server = grpc.storageServer({
  endpoint: topology.endpoint,
  service: new StorageService()
});
