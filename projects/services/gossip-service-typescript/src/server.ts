import { grpcServer, topologyPeers, KeyManager } from "orbs-core-library";
import GossipService from "./service";


export default function(nodeTopology: any, env: any) {
    const { NODE_NAME, SIGN_MESSAGES } = env;

    if (!NODE_NAME) {
        throw new Error("NODE_NAME can't be empty!");
    }

    const peers = topologyPeers(nodeTopology.peers);
    const signMessages = (SIGN_MESSAGES || "").toLowerCase() === "true";

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
        keyManager: keyManager
      };

    return grpcServer.builder()
                     .withService("Gossip", new GossipService(gossipServiceConfig));
}