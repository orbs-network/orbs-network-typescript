import { topology, grpc } from "orbs-common-library";
import SidechainConnectorService from "./service";

const server = grpc.sidechainConnectorServer({
  endpoint: topology.endpoint,
  service: new SidechainConnectorService()
});
