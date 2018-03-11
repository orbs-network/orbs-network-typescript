import * as path from "path";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { BlockStorage } from "./block-storage";
import { sortBy } from "lodash";

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
    this.queue.push(block);
  }

  public async appendBlocks(): Promise<void> {
    const data: Array<types.Block> = [];
    copyArray(this.queue, data);

    const sortedBlocks = sortBy(data, (block) => block.header.id);

    for (const block of sortedBlocks) {
      await this.blockStorage.addBlock(block);
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
