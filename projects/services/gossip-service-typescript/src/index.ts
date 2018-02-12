import { ErrorHandler, grpc } from "orbs-core-library";
import { topology } from "orbs-core-library/src/common-library/topology";

import GossipService from "./service";

ErrorHandler.setup();

const server = grpc.gossipServer({
  endpoint: topology.endpoint,
  service: new GossipService()
});
