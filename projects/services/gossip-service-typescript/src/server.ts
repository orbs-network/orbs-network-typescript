/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { grpcServer, topologyPeers, KeyManager, StartupCheckRunner } from "orbs-core-library";
import GossipService from "./service";


export default function (nodeTopology: any, env: any) {
  const { NODE_NAME, SIGN_MESSAGES, GOSSIP_PEER_POLL_INTERVAL } = env;

  if (!NODE_NAME) {
    throw new Error("NODE_NAME can't be empty!");
  }

  const peers = topologyPeers(nodeTopology.peers);
  const signMessages = (SIGN_MESSAGES || "").toLowerCase() === "true";
  const peerPollInterval = Number(GOSSIP_PEER_POLL_INTERVAL) || 5000;

  const keyManager = signMessages ? new KeyManager({
    privateKeyPath: "/opt/orbs/private-keys/message/secret-key",
    publicKeysPath: "/opt/orbs/public-keys/message"
  }) : undefined;

  const gossipServiceConfig = {
    nodeName: NODE_NAME,
    gossipPort: nodeTopology.gossipPort,
    peers,
    gossipPeers: nodeTopology.gossipPeers,
    signMessages: signMessages,
    keyManager: keyManager,
    peerPollInterval: peerPollInterval
  };

  const gossipService = new GossipService(gossipServiceConfig);
  const startupCheckRunner = new StartupCheckRunner("gossip-service", [gossipService]);

  return grpcServer.builder()
    .withStartupCheckRunner(startupCheckRunner)
    .withService("Gossip", gossipService);
}
