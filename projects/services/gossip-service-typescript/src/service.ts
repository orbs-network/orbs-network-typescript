import * as _ from "lodash";

import { logger, config, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";

export interface GossipServiceConfig extends ServiceConfig {
  gossipPort: number;
  peers: any;
  gossipPeers: any;
}

export default class GossipService extends Service {
  private serviceConfig: GossipServiceConfig;
  private gossip: Gossip;
  private peerPollInterval: any;

  public constructor(serviceConfig: GossipServiceConfig) {
    super(serviceConfig);
    this.serviceConfig = serviceConfig;
  }

  async initialize() {
    await this.initGossip();

  }

  async initGossip(): Promise<void> {
    this.gossip = new Gossip(this.serviceConfig.gossipPort, this.serviceConfig.gossipPeers, this.serviceConfig.peers, config.get("NODE_NAME"), config.get("NODE_IP"));

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

  async stop() {
    await super.stop();
    clearInterval(this.peerPollInterval);
    logger.info(`Shutting down`);
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
