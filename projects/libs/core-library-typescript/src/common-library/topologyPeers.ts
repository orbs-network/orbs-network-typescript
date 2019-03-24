/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { grpc } from "./grpc";
import { types } from "./types";

export function topologyPeers(topologyPeers: any[]): types.ClientMap {
  const res: types.ClientMap = {};
  for (const peer of topologyPeers) {
    switch (peer.service) {
      case "gossip": {
        res.gossip = grpc.gossipClient({ endpoint: peer.endpoint });
        break;
      }
      case "consensus": {
        res.consensus = grpc.consensusClient({ endpoint: peer.endpoint });
        res.subscriptionManager = grpc.subscriptionManagerClient({ endpoint: peer.endpoint });
        res.transactionPool = grpc.transactionPoolClient({ endpoint: peer.endpoint });
        break;
      }
      case "virtual-machine": {
        res.virtualMachine = grpc.virtualMachineClient({ endpoint: peer.endpoint });
        break;
      }
      case "storage": {
        res.blockStorage = grpc.blockStorageClient({ endpoint: peer.endpoint });
        res.stateStorage = grpc.stateStorageClient({ endpoint: peer.endpoint });
        break;
      }
      case "sidechain-connector": {
        res.sidechainConnector = grpc.sidechainConnectorClient({ endpoint: peer.endpoint });
        break;
      }
      default: {
        throw new Error(`Undefined peer service: ${peer.service}`);
      }
    }
  }
  return res;
}
