import { ErrorHandler, grpc } from "orbs-core-library/dist/common-library";
import { topology } from "orbs-core-library/dist/common-library/topology";

import ConsensusService from "./service";

ErrorHandler.setup();

const server = grpc.consensusServer({
  endpoint: topology.endpoint,
  service: new ConsensusService()
});
