import { topology, grpc } from "orbs-common-library";
import BlockStorageService from "./service";

const server = grpc.blockStorageServer({
  endpoint: topology.endpoint,
  service: new BlockStorageService()
});
