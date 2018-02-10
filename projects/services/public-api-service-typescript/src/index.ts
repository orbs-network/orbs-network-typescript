import { ErrorHandler, topology, grpc } from "orbs-common-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const server = grpc.publicApiServer({
  endpoint: topology.endpoint,
  service: new PublicApiService()
});
