import * as _ from "lodash";
import bind from "bind-decorator";

import { logger, grpc, types, topology } from "orbs-core-library";

import { BlockStorage } from "orbs-core-library";

const nodeTopology = topology();

export default class BlockStorageService {
  private blockStorage: BlockStorage;

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

  @bind
  public async getBlocks(rpc: types.GetBlocksContext) {
    logger.debug(`${nodeTopology.name}: getBlocks ${JSON.stringify(rpc.req)}`);

    rpc.res = { blocks: await this.blockStorage.getBlocks(rpc.req.lastBlockId) };
  }

  async initBlockStorage(): Promise<void> {
    this.blockStorage = new BlockStorage();
    await this.blockStorage.load();
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

    setInterval(() => this.askForHeartbeats(), 5000);
  }

  constructor() {
    setTimeout(() => this.main(), 0);
  }
}
