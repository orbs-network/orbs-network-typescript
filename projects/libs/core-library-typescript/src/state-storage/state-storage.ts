import * as _ from "lodash";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";

import { InMemoryKVStore } from "./kvstore";

import { delay } from "bluebird";
import { STARTUP_STATUS, StartupStatus } from "../common-library/startup-status";
import { StartupCheck } from "../common-library/startup-check";

export class StateStorage implements StartupCheck {
  public readonly SERVICE_NAME = "state-storage";
  private blockStorage: types.BlockStorageClient;

  private kvstore = new InMemoryKVStore();
  private lastBlockHeight: number;
  private pollInterval: NodeJS.Timer;
  private pollIntervalMs: number;
  private engineRunning: boolean;

  public constructor(blockStorage: types.BlockStorageClient, pollInterval: number) {
    this.blockStorage = blockStorage;
    this.pollIntervalMs = pollInterval;
    logger.debug(`Creating state storage with poll interval of ${this.pollIntervalMs}`);

    this.engineRunning = true;
    this.startPolling();
  }

  public stop() {
    this.engineRunning = false;
    this.stopPolling();
  }

  private startPolling() {
    if (this.engineRunning) {
      this.pollInterval = setInterval(() => this.pollBlockStorage(), this.pollIntervalMs);
    }
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
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

  public async pollBlockStorage() {
    // until we finish syncing all of them, lets stop the polling
    this.stopPolling();

    try {
      const { blocks } = await this.blockStorage.getBlocks({ lastBlockHeight: this.lastBlockHeight });

      if (blocks != undefined) {
        // Assuming an ordered list of blocks.
        for (const block of blocks) {
          await this.syncNextBlock(block);
        }
      }
    }
    catch (err) {
      if (err instanceof ReferenceError) {
        logger.warn(`Could not get blocks while polling, last height: ${this.lastBlockHeight},`, err);
      }
      else {
        throw err;
      }
    }
    finally {
      this.startPolling();
    }
  }

  private async syncNextBlock(block: types.Block) {
    if ((this.lastBlockHeight == undefined) || (block.header.height == this.lastBlockHeight + 1)) {
      logger.debug("Processing block:", block.header.height);

      for (const { contractAddress, key, value } of block.body.stateDiff) {
        this.kvstore.set(contractAddress, key, value);
      }
      this.lastBlockHeight = block.header.height;
    } else {
      throw new Error(`Unexpected block Height: ${block.header.height}. Expected ${this.lastBlockHeight + 1}, Out of sync?`);
    }
  }

  public async startupCheck(): Promise<StartupStatus> {

    if (!this.kvstore) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing kvstore" };
    }

    if (!this.pollIntervalMs) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing pollIntervalMs" };
    }

    if (!this.blockStorage) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: "Missing block storage client" };
    }

    return { name: this.SERVICE_NAME, status: STARTUP_STATUS.OK };
  }

}
