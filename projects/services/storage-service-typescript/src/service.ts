import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, topology, grpc, types } from "orbs-common-library";

import { BlockStorage } from "orbs-block-storage-library";
import { StateStorage } from "orbs-state-storage-library";

export default class StorageService {
  private blockStorage: BlockStorage;
  private stateStorage: StateStorage;

  // Block Storage RPC:

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async addBlock(rpc: types.AddBlockContext) {
    logger.debug(`${topology.name}: addBlock ${JSON.stringify(rpc.req)}`);

    await this.blockStorage.addBlock(rpc.req.block);

    rpc.res = {};
  }

  @bind
  public async getLastBlockId(rpc: types.GetLastBlockIdContext) {
    logger.debug(`${topology.name}: getLastBlockId ${JSON.stringify(rpc.req)}`);

    rpc.res = { blockId: await this.blockStorage.getLastBlockId() };
  }

  // State Storage RPC:

  @bind
  public async readKeys(rpc: types.ReadKeysContext) {
    logger.debug(`${topology.name}: readKeys ${rpc.req.address}/${rpc.req.keys}`);

    const keys = await this.stateStorage.readKeys(rpc.req.address, rpc.req.keys);
    rpc.res = { values: _.fromPairs([...keys]) };
  }

  async initBlockStorage(): Promise<void> {
    this.blockStorage = new BlockStorage();
    this.blockStorage.load();
  }

  async initStateStorage(): Promise<void> {
    this.stateStorage = new StateStorage(this.blockStorage);
    this.stateStorage.poll();
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    await Promise.all([
      this.initBlockStorage(),
      this.initStateStorage()
    ]);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
