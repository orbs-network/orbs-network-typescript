import { topology, grpc } from "orbs-common-library";
import SidechainConnectorService, { SidechainConnectorServiceOptions } from "./service";

const server = grpc.sidechainConnectorServer({
  endpoint: topology.endpoint,
  service: new SidechainConnectorService({
    ethereumNodeHttpAddress: process.argv[3] // argv[2] is "taken" by orbs-common-library/topology.ts
  })
});
