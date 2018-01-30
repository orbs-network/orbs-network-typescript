import { topology, grpc, config } from "orbs-common-library";
import SubscriptionManagerService from "./service";

const server = grpc.subscriptionManagerServer({
  endpoint: topology.endpoint,
  service: new SubscriptionManagerService({
    ethereumContractAddress: process.argv[3]
  })
});
