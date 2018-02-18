import { ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import PublicApiService from "./service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.run(grpc.publicApiServer, new PublicApiService());
};

main();
