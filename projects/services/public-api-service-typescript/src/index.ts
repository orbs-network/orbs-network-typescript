import { ErrorHandler, grpc, topology } from "orbs-core-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const server = grpc.publicApiServer({
  endpoint: topology().endpoint,
  service: new PublicApiService()
});
