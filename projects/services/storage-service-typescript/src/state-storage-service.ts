import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, grpc, types, topology, topologyPeers } from "orbs-core-library";

import { StateStorage } from "orbs-core-library";

const nodeTopology = topology();

export default class StateStorageService {
  private stateStorage: StateStorage;

  private blockStorage = topologyPeers(nodeTopology.peers).blockStorage;

  // State Storage RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @bind
  public async readKeys(rpc: types.ReadKeysContext) {
    logger.debug(`${nodeTopology.name}: readKeys ${rpc.req.address}/${rpc.req.keys}`);

    const keys = await this.stateStorage.readKeys(rpc.req.address, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }

  async initStateStorage(): Promise<void> {
    this.stateStorage = new StateStorage(this.blockStorage);
    this.stateStorage.poll();
  }

  async askForHeartbeat(peer: types.HeardbeatClient) {
    const res = await peer.getHeartbeat({ requesterName: nodeTopology.name, requesterVersion: nodeTopology.version });
    logger.debug(`${nodeTopology.name}: received heartbeat from '${res.responderName}(v${res.responderVersion})'`);
  }

  askForHeartbeats() {
  }

  async main() {
    logger.info(`${nodeTopology.name}: service started`);

    await this.initStateStorage();

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
