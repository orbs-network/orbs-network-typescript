import { ErrorHandler, grpc } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import StorageService from "./service";

ErrorHandler.setup();

const server = grpc.storageServer({
  endpoint: topology.endpoint,
  service: new StorageService()
});
