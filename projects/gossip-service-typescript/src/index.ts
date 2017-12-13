import { topology, grpc } from "orbs-common-library";
import GossipService from "./service";

const server = grpc.gossipServer({
  endpoint: topology.endpoint,
  service: new GossipService()
});
