import { ErrorHandler, grpc, topology } from "orbs-core-library";
import {  } from "orbs-core-library";

import ConsensusService from "./service";

ErrorHandler.setup();

const server = grpc.consensusServer({
  endpoint: topology().endpoint,
  service: new ConsensusService()
});
