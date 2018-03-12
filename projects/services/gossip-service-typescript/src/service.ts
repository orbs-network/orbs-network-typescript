import * as _ from "lodash";

import { logger, types } from "orbs-core-library";
import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus, RaftConsensusConfig } from "orbs-core-library";
import { Gossip } from "orbs-core-library";

export interface GossipServiceConfig extends ServiceConfig {
  gossipPort: number;
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
    this.gossip = new Gossip({ port: gossipConfig.gossipPort, localAddress: gossipConfig.nodeName,
      peers: (<GossipServiceConfig>this.config).peers });

    this.peerPollInterval = setInterval(() => {
      const activePeers = Array.from(this.gossip.activePeers()).sort();

      if (activePeers.length == 0) {
        logger.warn(`${this.gossip.localAddress} has no active peers`);
        this.connectToGossipPeers();
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
      this.connectToGossipPeers();
    }, Math.ceil(Math.random() * 3000));
  }

  async connectToGossipPeers() {
    logger.info(`${this.gossip.localAddress} is trying to connect to its peers`);
    return this.gossip.connect((<GossipServiceConfig>this.config).gossipPeers);
  }

  async shutdown() {
    clearInterval(this.peerPollInterval);
    return this.gossip.shutdown();
  }

  @Service.SilentRPCMethod
  public async broadcastMessage(rpc: types.BroadcastMessageContext) {
    this.gossip.broadcastMessage(rpc.req.broadcastGroup, rpc.req.messageType, rpc.req.buffer, rpc.req.immediate);

    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.recipient, rpc.req.broadcastGroup, rpc.req.messageType, rpc.req.buffer, rpc.req.immediate);

    rpc.res = {};
  }
}
