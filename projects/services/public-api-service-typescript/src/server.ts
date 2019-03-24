/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import PublicApiHTTPService from "./service";
import { topologyPeers } from "orbs-core-library";

export default function (nodeTopology: any, env: any): PublicApiHTTPService {
  const peers = topologyPeers(nodeTopology.peers);
  const { NODE_NAME, HTTP_PORT, HTTP_MANAGEMENT_PORT } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const httpNodeConfig = {
    nodeName: NODE_NAME,
    httpPort: HTTP_PORT || 80,
    httpManagementPort: HTTP_MANAGEMENT_PORT || 8081
  };

  return new PublicApiHTTPService(peers.virtualMachine, peers.transactionPool, httpNodeConfig);
}
