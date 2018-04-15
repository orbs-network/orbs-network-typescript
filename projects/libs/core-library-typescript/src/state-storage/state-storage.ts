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
  private pollIntervalMs: number;
  private engineRunning: boolean;

  public constructor(blockStorage: types.BlockStorageClient, pollInterval: number) {
    this.blockStorage = blockStorage;
    this.pollIntervalMs = pollInterval;
    logger.debug(`creating state storage with poll interval of ${this.pollIntervalMs}`);

    this.engineRunning = true;
    this.startPolling();
  }

  public stop() {
    this.engineRunning = false;
    this.stopPolling();
  }

  private startPolling() {
    if (this.engineRunning) {
      this.pollInterval = setInterval(() => this.pollBlockStorageCallback(), this.pollIntervalMs);
      logger.debug(`polling started, interval is ${this.pollIntervalMs}`);
    }
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
      logger.debug("polling stopped");
    }
  }

  public async readKeys(contractAddress: Buffer, keys: string[]) {
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
    let blocks: types.GetBlocksOutput;
    try {
      blocks = await this.blockStorage.getBlocks({ lastBlockHeight: this.lastBlockHeight });
    }
    catch (err) {
      logger.warn(`could not get blocks while polling, last height: ${this.lastBlockHeight}, ${err}`);
    }

    if (blocks != undefined) {
      // until we finish syncing all of them, lets stop the polling
      try {
        this.stopPolling();
        // Assuming an ordered list of blocks.
        for (const block of blocks.blocks) {
          await this.syncNextBlock(block);
        }
      }
      finally {
        this.startPolling();
      }
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
