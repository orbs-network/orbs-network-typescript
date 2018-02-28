import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";

export interface GossipServiceConfig extends ServiceConfig {
  gossipPort: number;
  nodeIp: string;
  peers: any;
  gossipPeers: any;
}

export default class GossipService extends Service {
  private gossip: Gossip;
  private peerPollInterval: any;

  public constructor(serviceConfig: GossipServiceConfig) {
    super(serviceConfig);
  }

  async initialize() {
    await this.initGossip();
  }

  async initGossip(): Promise<void> {
    const gossipConfig = <GossipServiceConfig>this.config;
    this.gossip = new Gossip(gossipConfig.gossipPort, gossipConfig.gossipPeers, gossipConfig.peers,
      gossipConfig.nodeName, gossipConfig.nodeIp);

    this.peerPollInterval = setInterval(() => {
      const activePeers = Array.from(this.gossip.activePeers()).sort();

      if (activePeers.length == 0) {
        logger.warn(`${this.gossip.localAddress} has no active peers`);
      } else {
        logger.info(`${this.gossip.localAddress} has active peers`, { activePeers });
      }

      const broadcastGroups = Array.from(this.gossip.activeBroadcastGroups()).sort();

      if (broadcastGroups.length == 0) {
        logger.warn(`${this.gossip.localAddress} has no active broadcast groups`);
      } else {
        logger.info(`${this.gossip.localAddress} has active broadcast groups`, { broadcastGroups });
      }
    }, 5000);

    setTimeout(() => {
      this.gossip.discoverPeers().then((gossipPeers: string[]) => {
        logger.info(`Found gossip peers`, { peers: gossipPeers });

        this.gossip.connect(gossipPeers);
      }).catch(logger.error);
    }, Math.ceil(Math.random() * 3000));
  }

  async shutdown() {
    clearInterval(this.peerPollInterval);
    return this.gossip.shutdown();
  }

  @Service.SilentRPCMethod
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    this.gossip.broadcastMessage(rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.Recipient, rpc.req.BroadcastGroup, rpc.req.MessageType, rpc.req.Buffer, rpc.req.Immediate);

    rpc.res = {};
  }
}
