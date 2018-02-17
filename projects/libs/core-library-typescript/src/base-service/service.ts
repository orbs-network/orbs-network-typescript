import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "../common-library";

export interface RPCMethodOptions {
  log: boolean;
}

export abstract class Service {
  public nodeTopology: any;
  public peers: types.ClientMap;

  private server: any;

  public constructor() {
    this.nodeTopology = topology();
    this.peers = topologyPeers(this.nodeTopology.peers);
  }

  abstract async initialize(): Promise<void>;

  protected static RPCMethod(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>,
    silent: boolean = false): any {
    if (!descriptor || (typeof descriptor.value !== "function")) {
      throw new TypeError(`Only methods can be decorated with @RPCMethod. <${propertyKey}> is not a method!`);
    }

    if (!silent) {
      const originalMethod = descriptor.value;
      descriptor.value = function(rpc: any) {
        logger.debug(`${this.nodeTopology.name}: ${propertyKey} ${JSON.stringify(rpc.req)}`);

        return originalMethod.apply(this, [rpc]);
      };
    }

    return bind(target, propertyKey, descriptor);
  }

  protected static SilentRPCMethod(target: Object, propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>): any {
    return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
      return Service.RPCMethod(target, propertyKey, descriptor, true);
    };
  }

  public async start() {
    logger.info(`${this.nodeTopology.name}: service started`);

    await this.initialize();
  }

  public async stop() {
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: this.nodeTopology.name, requesterVersion: this.nodeTopology.version });

    logger.debug(`${this.nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  public askForHeartbeats(peers: types.HeardbeatClient[], interval: number = 5000) {
    setInterval(() => {
      peers.forEach((peer) => {
        this.askForHeartbeat(peer);
      });
    }, interval);
  }

  @this.RPCMethod
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    rpc.res = { responderName: this.nodeTopology.name, responderVersion: this.nodeTopology.version };
  }
}
