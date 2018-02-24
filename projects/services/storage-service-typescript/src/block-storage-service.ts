import * as _ from "lodash";

import { logger, types } from "orbs-core-library";

import { Service, ServiceConfig } from "orbs-core-library";
import { BlockStorage } from "orbs-core-library";

export interface BlockStorageServiceConfig extends ServiceConfig {
  dbPath: string;
}

export default class BlockStorageService extends Service {
  private blockStorage: BlockStorage;

  public constructor(serviceConfig: BlockStorageServiceConfig) {
    super(serviceConfig);
  }

  async initialize() {
    await this.initBlockStorage();
  }

  async initBlockStorage(): Promise<void> {
    const blockStorageConfig = <BlockStorageServiceConfig>this.config;
    this.blockStorage = new BlockStorage(blockStorageConfig.dbPath);
    await this.blockStorage.load();
  }

  @Service.RPCMethod
  public async addBlock(rpc: types.AddBlockContext) {
    await this.blockStorage.addBlock(rpc.req.block);

    rpc.res = {};
  }

  @Service.RPCMethod
  public async getLastBlockId(rpc: types.GetLastBlockIdContext) {
    rpc.res = { blockId: await this.blockStorage.getLastBlockId() };
  }

  @Service.RPCMethod
  public async getBlocks(rpc: types.GetBlocksContext) {
    rpc.res = { blocks: await this.blockStorage.getBlocks(rpc.req.lastBlockId) };
  }
}
