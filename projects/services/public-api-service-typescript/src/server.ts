import PublicApiHTTPService from "./http-service";
import { topologyPeers } from "orbs-core-library";

export default function (nodeTopology: any, env: any): PublicApiHTTPService {
  const peers = topologyPeers(nodeTopology);
  const { NODE_NAME } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const httpNodeConfig = {
    nodeName: NODE_NAME,
    httpPort: 80
  };

  return new PublicApiHTTPService(peers.virtualMachine, peers.transactionPool, httpNodeConfig);
}
