import { topology, grpc, config } from "orbs-common-library";
import SidechainConnectorService, { SidechainConnectorServiceOptions } from "./service";

const server = grpc.sidechainConnectorServer({
  endpoint: topology.endpoint,
  service: new SidechainConnectorService({
    ethereumNodeHttpAddress: config.get("ethereumNodeAddress")
  })
});
