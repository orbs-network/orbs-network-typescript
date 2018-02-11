import { ErrorHandler, topology, grpc } from "orbs-core-library/dist/common-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const server = grpc.publicApiServer({
  endpoint: topology.endpoint,
  service: new PublicApiService()
});
