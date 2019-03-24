/**
 * Copyright 2018 the orbs-network-typescript authors
 * This file is part of the orbs-network-typescript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as path from "path";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { BlockStorage } from "./block-storage";
import { sortBy, uniqBy } from "lodash";

function copyArray<T>(source: Array<T>, destination: Array<T>) {
  while (source.length > 0) {
    destination.push(source.pop());
  }
}

export class BlockStorageSync {
  private blockStorage: BlockStorage;
  private queue: Array<types.Block> = [];
  private node: string;

  constructor(blockStorage: BlockStorage) {
    this.blockStorage = blockStorage;
  }

  public onReceiveBlock(block: types.Block) {
    if (!block) {
      throw new Error("Tried to push empty block into the queue!");
    }

    this.queue.push(block);
  }

  public async appendBlocks(): Promise<void> {
    const data: Array<types.Block> = [];
    copyArray(this.queue, data);

    const uniqueBlocks = uniqBy(data, (block) => block.header.height);
    const sortedBlocks = sortBy(uniqueBlocks, (block) => block.header.height);

    logger.info(`BlockStorageSync tries to append new blocks`);

    for (const block of sortedBlocks) {
      try {
        await this.blockStorage.addBlock(block);
      } catch (e) {
        logger.error(`Failed to addBlock()`, e);
      }
    }
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public isSyncing(): boolean {
    return this.node !== undefined;
  }

  public isSyncingWith(node: string): boolean {
    return this.node === node;
  }

  public on(node: string) {
    this.node = node;
  }

  public off() {
    this.node = undefined;
  }

  public getNode() {
    return this.node;
  }
}
