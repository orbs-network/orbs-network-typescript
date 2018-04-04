import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers, KeyManager } from "orbs-core-library";

import GossipService from "./service";

const { NODE_NAME, SIGN_MESSAGES } = process.env;

ErrorHandler.setup();

Service.initLogger(path.join(__dirname, "../../../../logs/gossip.log"));

if (!NODE_NAME) {
  throw new Error("NODE_NAME can't be empty!");
}

const nodeTopology = topology();
const peers = topologyPeers(nodeTopology.peers);
const signMessages = (SIGN_MESSAGES || "").toLowerCase() === "true";

const keyManager = signMessages ? new KeyManager({
  privateKeyPath: "/opt/orbs/private-keys/message/secret-key",
  publicKeysPath: "/opt/orbs/public-keys/message"
}) : undefined;

const gossipConfig = {
  nodeName: NODE_NAME,
  gossipPort: nodeTopology.gossipPort,
  peers,
  gossipPeers: nodeTopology.gossipPeers,
  signMessages: signMessages,
  keyManager: keyManager
};

ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
