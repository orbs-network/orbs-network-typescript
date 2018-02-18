import { config, ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import SidehainConnectorService from "./service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.run(grpc.sidechainConnectorServer, new SidehainConnectorService({
    ethereumNodeHttpAddress: config.get("ethereumNodeAddress")
  }));
};

main();
