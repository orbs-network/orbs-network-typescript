import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, grpc, types, topology } from "orbs-core-library";

import { BlockStorage } from "orbs-core-library";
import { StateStorage } from "orbs-core-library";

const nodeTopology = topology();

export default class StorageService {
  private blockStorage: BlockStorage;
  private stateStorage: StateStorage;

  // Block Storage RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${nodeTopology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: nodeTopology.name, responderVersion: nodeTopology.version };
  }

  @bind
  public async addBlock(rpc: types.AddBlockContext) {
    logger.debug(`${nodeTopology.name}: addBlock ${JSON.stringify(rpc.req)}`);

    await this.blockStorage.addBlock(rpc.req.block);

    rpc.res = {};
  }

  @bind
  public async getLastBlockId(rpc: types.GetLastBlockIdContext) {
    logger.debug(`${nodeTopology.name}: getLastBlockId ${JSON.stringify(rpc.req)}`);

    rpc.res = { blockId: await this.blockStorage.getLastBlockId() };
  }

  // State Storage RPC:

  @bind
  public async readKeys(rpc: types.ReadKeysContext) {
    logger.debug(`${nodeTopology.name}: readKeys ${rpc.req.address}/${rpc.req.keys}`);

    const keys = await this.stateStorage.readKeys(rpc.req.address, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }

  async initBlockStorage(): Promise<void> {
    this.blockStorage = new BlockStorage();
    await this.blockStorage.load();
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

    await this.initBlockStorage();
    await this.initStateStorage();

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
