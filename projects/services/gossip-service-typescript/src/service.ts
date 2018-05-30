import { logger, types } from "orbs-core-library";
import { Service, ServiceConfig } from "orbs-core-library";
import { Consensus, BaseConsensusConfig } from "orbs-core-library";
import { Gossip, KeyManager } from "orbs-core-library";
import * as _ from "lodash";

export interface GossipServiceConfig extends ServiceConfig {
  gossipPort: number;
  peers: any;
  gossipPeers: any;
  keyManager?: KeyManager;
  signMessages: boolean;
  peerPollInterval: number;
}

export default class GossipService extends Service {
  private gossip: Gossip;
  private peerPollInterval: any;
  private previousActivePeers: String[];
  private previousBroadcastGroups: String[];


  public constructor(serviceConfig: GossipServiceConfig) {
    super(serviceConfig);
  }


  private configSanitation(key: string, value: any): any {
    if (key == "keyManager") {
      return undefined;
    }

    return value;
  }

  async initialize() {
    await this.initGossip();
  }

  async initGossip(): Promise<void> {
    this.previousActivePeers = [];
    this.previousBroadcastGroups = [];
    const gossipConfig = <GossipServiceConfig>this.config;
    logger.debug(`Gossip service starting with config: ${JSON.stringify(gossipConfig, this.configSanitation)}`);
    this.gossip = new Gossip({
      port: gossipConfig.gossipPort,
      localAddress: gossipConfig.nodeName,
      peers: (<GossipServiceConfig>this.config).peers,
      keyManager: (<GossipServiceConfig>this.config).keyManager,
      signMessages: (<GossipServiceConfig>this.config).signMessages
    });

    this.peerPollInterval = setInterval(() => {
      const activePeers = Array.from(this.gossip.activePeers()).sort();
      if (activePeers.length == 0) {
        if (this.previousActivePeers.length > 0) {
          logger.warn(`${this.gossip.localAddress} has lost all its active peers and is all lone`);
        }
        this.connectToGossipPeers();
      } else {
        if (!_.isEqual(this.previousActivePeers, activePeers)) {
          logger.info(`${this.gossip.localAddress} has updated active peers`, { activePeers });
        }
      }
      this.previousActivePeers = activePeers;

      const broadcastGroups = Array.from(this.gossip.activeBroadcastGroups()).sort();
      if (broadcastGroups.length == 0 && this.previousBroadcastGroups.length > 0) {
        logger.warn(`${this.gossip.localAddress} has lost all its broadcast groups`);
      } else {
        if (!_.isEqual(this.previousBroadcastGroups, broadcastGroups)) {
          logger.info(`${this.gossip.localAddress} has updated active broadcast groups`, { broadcastGroups });
        }
      }
      this.previousBroadcastGroups = broadcastGroups;
    }, gossipConfig.peerPollInterval);

    this.connectToGossipPeers();
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
    logger.debug(`Gossip service sending broadcast message`);
    this.gossip.broadcastMessage(rpc.req.broadcastGroup, rpc.req.messageType, rpc.req.buffer, rpc.req.immediate);

    rpc.res = {};
  }

  @Service.SilentRPCMethod
  public async unicastMessage(rpc: types.UnicastMessageContext) {
    this.gossip.unicastMessage(rpc.req.recipient, rpc.req.broadcastGroup, rpc.req.messageType, rpc.req.buffer, rpc.req.immediate);

    rpc.res = {};
  }
}
