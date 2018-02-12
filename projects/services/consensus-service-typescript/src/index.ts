import { ErrorHandler, grpc, topology } from "orbs-core-library";
import {  } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";

ErrorHandler.setup();

const nodeTopology = topology();

grpc.consensusServiceServer({
  endpoint: nodeTopology.endpoint,
  services: [new ConsensusService(), new SubscriptionManagerService()]
});
