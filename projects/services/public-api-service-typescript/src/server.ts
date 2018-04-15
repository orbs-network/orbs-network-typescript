import PublicApiHTTPService from "./service";
import { topologyPeers } from "orbs-core-library";

export default function (nodeTopology: any, env: any): PublicApiHTTPService {
  const peers = topologyPeers(nodeTopology.peers);
  const { NODE_NAME, HTTP_PORT } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const httpNodeConfig = {
    nodeName: NODE_NAME,
    httpPort: HTTP_PORT || 80
  };

  return new PublicApiHTTPService(peers.virtualMachine, peers.transactionPool, httpNodeConfig);
}
