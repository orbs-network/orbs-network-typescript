import { topology, grpc } from "orbs-common-library";
import StateStorageService from "./service";

const server = grpc.stateStorageServer({
  endpoint: topology.endpoint,
  service: new StateStorageService()
});
