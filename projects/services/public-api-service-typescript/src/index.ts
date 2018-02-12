import { ErrorHandler, grpc } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import PublicApiService from "./service";

ErrorHandler.setup();

const server = grpc.publicApiServer({
  endpoint: topology.endpoint,
  service: new PublicApiService()
});
