import { topology, grpc } from "orbs-common-library";
import ChatterService from "./service";

const server = grpc.chatterServer({
  endpoint: topology.endpoint,
  service: new ChatterService()
});
