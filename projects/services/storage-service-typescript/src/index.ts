import { ErrorHandler, grpc } from "orbs-core-library/dist/common-library";
import { topology } from "orbs-core-library/dist/common-library/topology";

import StorageService from "./service";

ErrorHandler.setup();

const server = grpc.storageServer({
  endpoint: topology.endpoint,
  service: new StorageService()
});
