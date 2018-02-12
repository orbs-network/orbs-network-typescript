import { ErrorHandler, grpc } from "orbs-core-library/dist/common-library";
import { topology } from "orbs-core-library/dist/common-library/topology";

import PublicApiService from "./service";

ErrorHandler.setup();

const server = grpc.publicApiServer({
  endpoint: topology.endpoint,
  service: new PublicApiService()
});
