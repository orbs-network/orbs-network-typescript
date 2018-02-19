import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "../common-library";
import { isObject } from "lodash";

export interface RPCMethodOptions {
  log: boolean;
}

export abstract class Service {
  public name: string;
  public nodeTopology: any;
  public peers: types.ClientMap;

  private heartbeatInterval: any;

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
    return Service.RPCMethod(target, propertyKey, descriptor, true);
  }

  public constructor(nodeTopology?: any) {
    this.name = this.constructor.name;
    this.nodeTopology = isObject(nodeTopology) ? nodeTopology : topology();
    this.peers = topologyPeers(this.nodeTopology.peers);
  }

  abstract async initialize(): Promise<void>;

  public async start() {
    await this.initialize();

    logger.info(`${this.nodeTopology.name} (${this.name}): service started`);
  }

  public async stop() {
    clearInterval(this.heartbeatInterval);
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: this.nodeTopology.name, requesterVersion: this.nodeTopology.version });

    logger.debug(`${this.nodeTopology.name} (${this.name}): received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  public askForHeartbeats(peers: types.HeardbeatClient[], interval: number = 5000) {
    this.heartbeatInterval = setInterval(async () => {
      for (const peerName in peers) {
        const peer = peers[peerName];
        logger.debug(`Trying to get a heartbeat from ${peerName}: unedefined? ${peer === undefined}`, this.nodeTopology);
        await this.askForHeartbeat(peer);
      }

    }, interval);
  }

  @Service.RPCMethod
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    rpc.res = { responderName: this.nodeTopology.name, responderVersion: this.nodeTopology.version };
  }
}
