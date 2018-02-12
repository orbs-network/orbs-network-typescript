import { ErrorHandler, grpc } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import ConsensusService from "./service";

ErrorHandler.setup();

const server = grpc.consensusServer({
  endpoint: topology.endpoint,
  service: new ConsensusService()
});
