import { logger, ErrorHandler, topology, grpc, topologyPeers, types } from "orbs-common-library";
import bind from "bind-decorator";

import BlockStorage from "./block-storage";

ErrorHandler.setup();

export default class BlockStorageService {
  private db: BlockStorage;

  @bind
  public async getHeartbeat(rpc: types.GetHeartbeatContext) {
    logger.debug(`${topology.name}: service '${rpc.req.requesterName}(v${rpc.req.requesterVersion})' asked for heartbeat`);
    rpc.res = { responderName: topology.name, responderVersion: topology.version };
  }

  @bind
  public async addBlock(rpc: types.AddBlockContext) {
    logger.debug(`${topology.name}: addBlock ${JSON.stringify(rpc.req)}`);

    await this.db.addBlock(rpc.req.block);

    rpc.res = {};
  }

  @bind
  public async getBlocks(rpc: types.GetBlocksContext) {
    logger.debug(`${topology.name}: getBlocks ${JSON.stringify(rpc.req)}`);

    rpc.res = { blocks: await this.db.getBlocks(rpc.req.lastBlockId) };
  }

  @bind
  public async getLastBlockId(rpc: types.GetLastBlockIdContext) {
    logger.debug(`${topology.name}: getLastBlockId ${JSON.stringify(rpc.req)}`);

    rpc.res = { blockId: await this.db.getLastBlockId() };
  }

  async main() {
    logger.info(`${topology.name}: service started`);

    this.db = new BlockStorage();

    await this.db.load();
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
