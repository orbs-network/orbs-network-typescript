import * as _ from "lodash";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { InMemoryKVStore } from "./kvstore";

import { delay } from "bluebird";

export class StateStorage {
  private blockStorage: types.BlockStorageClient;

  private kvstore = new InMemoryKVStore();
  private lastBlockHeight: number;
  private pollInterval: NodeJS.Timer;

  public constructor(blockStorage: types.BlockStorageClient) {
    this.blockStorage = blockStorage;
  }

  public poll() {
    this.pollInterval = setInterval(() => this.pollBlockStorageCallback(), 200);
  }

  public stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  public async readKeys(contractAddress: types.ContractAddress, keys: string[]) {
    await this.waitForBlockState();

    return await this.kvstore.getMany(contractAddress, keys);
  }

  private async waitForBlockState(timeout = 5000) {
    const { block } = await this.blockStorage.getLastBlock({});
    while (timeout > 0) {
      if (block.header.height <= this.lastBlockHeight) {
        return;
      }
      await delay(200);
      timeout -= 200;
    }
    throw new Error(`Timeout in attempt to read block state (${block.header.height} != ${this.lastBlockHeight})`);
  }

  private async pollBlockStorageCallback() {
    const { blocks } = await this.blockStorage.getBlocks({ lastBlockHeight: this.lastBlockHeight });

    // Assuming an ordered list of blocks.
    for (const block of blocks) {
      await this.syncNextBlock(block);
    }
  }

  private async syncNextBlock(block: types.Block) {
    if ((this.lastBlockHeight == undefined) || (block.header.height == this.lastBlockHeight + 1)) {
      logger.debug("Processing block:", block.header.height);

      for (const { contractAddress, key, value} of block.body.stateDiff) {
        this.kvstore.set(contractAddress, key, value);
      }
      this.lastBlockHeight = block.header.height;
    } else {
      throw new Error(`Unexpected block Height: ${block.header.height}. Expected ${ this.lastBlockHeight + 1 }, Out of sync?`);
    }
  }
}
