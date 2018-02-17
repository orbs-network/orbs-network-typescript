import * as _ from "lodash";

import { logger, config, topology, topologyPeers, grpc, types } from "orbs-core-library";

import { Service } from "orbs-core-library";
import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";

const nodeTopology = topology();

export default class GossipService extends Service {
  private gossip: Gossip;

  // Gossip RPC:

  @Service.RPCMethod
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);

    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @Service.RPCMethod
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    this.gossip.broadcastMessage(rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  @Service.RPCMethod
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.Recipient, rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
    const peers = topologyPeers(nodeTopology.peers);

    this.askForHeartbeat(peers.publicApi);
    this.askForHeartbeat(peers.consensus);
  }

  async initGossip(): Promise<void> {
    this.gossip = new Gossip(nodeTopology.gossipPort, config.get("NODE_NAME"), config.get("NODE_IP"));

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
    logger.info(`${nodeTopology.name}: service started`);

    await this.initGossip();

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    super();

    setTimeout(() => this.main(), 0);
  }
}
