import { topology, grpc } from "orbs-common-library";
import SubscriptionManagerService from "./service";

const server = grpc.subscriptionManagerServer({
  endpoint: topology.endpoint,
  service: new SubscriptionManagerService()
});
