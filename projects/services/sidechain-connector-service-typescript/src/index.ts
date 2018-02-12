import { config, ErrorHandler, grpc, topology } from "orbs-core-library";

import SidehainConnectorService from "./service";

ErrorHandler.setup();

const server = grpc.sidechainConnectorServer({
  endpoint: topology().endpoint,
  service: new SidehainConnectorService({
    ethereumNodeHttpAddress: config.get("ethereumNodeAddress")
  })
});
