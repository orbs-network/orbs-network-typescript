import { ErrorHandler, grpc, ServiceRunner } from "orbs-core-library";

import GossipService from "./service";

ErrorHandler.setup();

const main = async () => {
  await ServiceRunner.run(grpc.gossipServer, new GossipService());
};

main();
