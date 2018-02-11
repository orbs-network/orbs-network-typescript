import { ErrorHandler, grpc } from "orbs-core-library/dist/common-library";
import { topology } from "orbs-core-library/dist/common-library/topology";

import GossipService from "./service";

ErrorHandler.setup();

const server = grpc.gossipServer({
  endpoint: topology.endpoint,
  service: new GossipService()
});
