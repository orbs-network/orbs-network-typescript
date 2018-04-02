import * as path from "path";

import { logger, ErrorHandler, grpc, Service, ServiceRunner, topology, topologyPeers, Signatures } from "orbs-core-library";

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
const sigatures = new Signatures({
  message: {
    privateKeyPath: "/opt/orbs/private-keys/message/secret-key",
    publicKeysPath: "/opt/orbs/public-keys/message"
  }
});

const gossipConfig = {
  nodeName: NODE_NAME,
  gossipPort: nodeTopology.gossipPort,
  peers,
  gossipPeers: nodeTopology.gossipPeers,
  signMessages: signMessages,
  signatures: sigatures
};

ServiceRunner.run(grpc.gossipServer, new GossipService(gossipConfig), nodeTopology.endpoint);
