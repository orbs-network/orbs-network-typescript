import { topology, grpc } from "orbs-common-library";
import ConsensusService from "./service";

const server = grpc.consensusServer({
  endpoint: topology.endpoint,
  service: new ConsensusService()
});
