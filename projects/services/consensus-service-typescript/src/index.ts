import { ErrorHandler, topology, grpc } from "orbs-core-library/dist/common-library";

import ConsensusService from "./service";

ErrorHandler.setup();

const server = grpc.consensusServer({
  endpoint: topology.endpoint,
  service: new ConsensusService()
});
