import { logger, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";

export default class SusbcriptionManagerService {

  peers: types.ClientMap;

  // rpc interface

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.info(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  // service logic

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.info(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  async getSubscriptionStatus(rpc: types.GetSubscriptionStatusContext) {
  }

  askForHeartbeats() {
  }

  async main() {
    this.peers = topologyPeers(topology.peers);
    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    logger.info(`${topology.name}: service started`);
    setTimeout(() => this.main(), 2000);
  }

}
