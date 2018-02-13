import { ErrorHandler, grpc, topology } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

ErrorHandler.setup();

const nodeTopology = topology();

grpc.consensusServiceServer({
  endpoint: nodeTopology.endpoint,
  services: [new ConsensusService(), new SubscriptionManagerService(), new TransactionPoolService()]
});
