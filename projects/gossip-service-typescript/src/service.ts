import { logger, ErrorHandler, topology, grpc, topologyPeers, types } from "orbs-common-library";
import Gossip from "./gossip";
import bind from "bind-decorator";

ErrorHandler.setup();

export default class GossipService {

  peers: types.ClientMap;
  gossip = new Gossip(topology.gossipPort);

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    logger.debug(`${topology.name}: broadcastMessage ${JSON.stringify(rpc.req)}`);
    this.gossip.broadcastMessage(rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);
    rpc.res = {};
  }

  @bind
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    logger.debug(`${topology.name}: unicastMessage ${JSON.stringify(rpc.req)}`);
    this.gossip.unicastMessage(rpc.req.Recipient, rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);
    rpc.res = {};
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    this.askForHeartbeat(this.peers.publicApi);
    // this.askForHeartbeat(this.peers.transactionPool);
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    // setInterval(() => this.askForHeartbeats(), 5000);
    setTimeout(() => {
      this.gossip.connect(topology.gossipPeers);
    }, Math.ceil(Math.random() * 3000));
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }
}
