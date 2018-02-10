import { ErrorHandler, topology, grpc } from "orbs-common-library";

import ConsensusService from "./service";

ErrorHandler.setup();

const server = grpc.consensusServer({
  endpoint: topology.endpoint,
  service: new ConsensusService()
});
