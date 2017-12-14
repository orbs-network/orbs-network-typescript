import { topology, grpc } from "orbs-common-library";
import PublicApiService from "./service";

const server = grpc.publicApiServer({
  endpoint: topology.endpoint,
  service: new PublicApiService()
});
