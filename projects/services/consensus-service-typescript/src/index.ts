import { ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import ConsensusService from "./consensus-service";
import SubscriptionManagerService from "./subscription-manager-service";
import TransactionPoolService from "./transaction-pool-service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.runMulti(grpc.consensusServiceServer, [
    new ConsensusService(),
    new SubscriptionManagerService(),
    new TransactionPoolService()
  ]);
};

main();
