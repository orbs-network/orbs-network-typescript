import { grpc } from "./grpc";
import { types } from "./types";

export function topologyPeers(topologyPeers: any[]): types.ClientMap {
  const res: types.ClientMap = {};
  for (const peer of topologyPeers) {
    switch (peer.service) {
      case "chatter": {
        res.chatter = grpc.chatterClient({ endpoint: peer.endpoint });
        break;
      }
      case "public-api": {
        res.publicApi = grpc.publicApiClient({ endpoint: peer.endpoint });
        break;
      }
      case "transaction-pool": {
        res.transactionPool = grpc.transactionPoolClient({ endpoint: peer.endpoint });
        break;
      }
      case "gossip": {
        res.gossip = grpc.gossipClient({ endpoint: peer.endpoint });
        break;
      }
      case "consensus": {
        res.consensus = grpc.consensusClient({ endpoint: peer.endpoint });
        break;
      }
      case "virtual-machine": {
        res.virtualMachine = grpc.virtualMachineClient({ endpoint: peer.endpoint });
        break;
      }
      case "state-storage": {
        res.stateStorage = grpc.stateStorageClient({ endpoint: peer.endpoint });
        break;
      }
      case "block-storage": {
        res.blockStorage = grpc.blockStorageClient({ endpoint: peer.endpoint });
        break;
      }
      default: {
        throw `Undefined peer service: ${peer.service}`;
      }
    }
  }
  return res;
}
