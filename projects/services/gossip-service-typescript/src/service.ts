import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, config, topologyPeers, grpc, types } from "orbs-core-library/dist/common-library";
import { topology } from "orbs-core-library/dist/common-library/topology";

import { Consensus, RaftConsensusConfig } from "orbs-core-library/dist/consensus";
import { Gossip } from "orbs-core-library/dist/gossip";

export default class GossipService {
  private gossip: Gossip;

  // Gossip RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    this.gossip.broadcastMessage(rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  @bind
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.Recipient, rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: topology.name, requesterVersion: topology.version });
    logger.debug(`${topology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(topology.peers);

    this.askForHeartbeat(peers.gossip);
  }

  async initGossip(): Promise<void> {
    this.gossip = new Gossip(topology.gossipPort, config.get("NODE_NAME"), config.get("NODE_IP"));

    setInterval(() => {
      const activePeers = Array.from(this.gossip.activePeers()).sort();

      if (activePeers.length == 0) {
        logger.warn(`${this.gossip.localAddress} has no active peers`);
      } else {
        logger.info(`${this.gossip.localAddress} has active peers`, {activePeers});
      }
    }, 5000);

    setTimeout(() => {
      this.gossip.discoverPeers().then((gossipPeers: string[]) => {
        logger.info(`Found gossip peers`, { peers: gossipPeers });

        this.gossip.connect(gossipPeers);
      }).catch(logger.error);
    }, Math.ceil(Math.random() * 3000));
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    await this.initGossip();

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
