import { topology, grpc } from "orbs-common-library";
import TransactionPoolService from "./service";

const server = grpc.transactionPoolServer({
  endpoint: topology.endpoint,
  service: new TransactionPoolService()
});
