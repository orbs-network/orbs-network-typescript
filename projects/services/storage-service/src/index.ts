import bind from "bind-decorator";

import { ErrorHandler, topology, grpc } from "orbs-common-library";

import StorageService from "./service";

const server = grpc.storageServer({
  endpoint: topology.endpoint,
  service: new StorageService()
});
