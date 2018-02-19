import * as path from "path";

import { logger } from "../common-library/logger";
import { types } from "../common-library/types";
import { config } from "../common-library/config";

import { LevelDBDriver } from "./leveldb-driver";

const NODE_NAME = config.get("NODE_NAME");

export class BlockStorage {
  public static readonly LAST_BLOCK_ID_KEY: string = "last";
  public static readonly LEVELDB_PATH: string = path.resolve(`../../../db/blocks_${NODE_NAME}.db`);
  public static readonly GENESIS_BLOCK: types.Block = {
    header: {
      version: 0,
      id: 0,
      prevBlockId: -1
    },
    tx: { contractAddress: "0", sender: "", signature: "", payload: "{}" },
    modifiedAddressesJson: "{}"
  };

  private lastBlock: types.Block;
  private db: LevelDBDriver;

  public constructor() {
    // Open/create the blocks LevelDB database.
    this.db = new LevelDBDriver(this.getDBPath());
  }

  public getDBPath(): string {
    return config.get("LEVELDB_PATH") || BlockStorage.LEVELDB_PATH;
  }

  public async load(): Promise<void> {
    // Get the ID of the last block and use it to get actual block.
    let lastBlockId;
    try {
      lastBlockId = await this.db.get<number>(BlockStorage.LAST_BLOCK_ID_KEY);
    } catch (e) {
      if (e.notFound) {
        logger.warn("Couldn't get last block ID. Restarting from the genesis block...");

        lastBlockId = BlockStorage.GENESIS_BLOCK.header.id;

        await this.db.put<number>(BlockStorage.LAST_BLOCK_ID_KEY, lastBlockId);
        await this.putBlock(BlockStorage.GENESIS_BLOCK);
      } else {
        throw e;
      }
    }

    logger.info(`Got last block ID: ${lastBlockId}`);

    this.lastBlock = await this.getBlock(lastBlockId);
  }

  public async shutdown() {
    logger.info(`Shutting down block storage`);
    return this.db.close();
  }

  // Adds new block to the persistent block storage.
  //
  // NOTE: this method should be only called serially.
  public async addBlock(block: types.Block) {
    this.verifyNewBlock(block);

    await this.db.put<number>(BlockStorage.LAST_BLOCK_ID_KEY, block.header.id);
    await this.putBlock(block);

    this.lastBlock = block;

    logger.info(`Added new block with block ID: ${block.header.id}`);
  }

  // Returns an array of blocks, starting from a specific block ID and up to the last block.
  public async getBlocks(fromLastBlockId: number): Promise<types.Block[]> {
    const blocks: types.Block[] = [];

    if (fromLastBlockId == this.lastBlock.header.id) {
      return blocks;
    }

    for (let i = fromLastBlockId; i < this.lastBlock.header.id; ++i) {
      blocks.push(await this.getBlock(i + 1));
    }

    return blocks;
  }

  public async getLastBlockId(): Promise<number> {
    return this.lastBlock.header.id;
  }

  public async hasNewBlocks(fromLastBlockId: number): Promise<boolean> {
    return await this.getLastBlockId() > fromLastBlockId;
  }

  private verifyNewBlock(block: types.Block) {
    if (block.header.id != this.lastBlock.header.id + 1) {
      throw new Error(`Invalid block ID of block: ${JSON.stringify(block)}!`);
    }

    if (block.header.prevBlockId !== this.lastBlock.header.id) {
      throw new Error(`Invalid prev block ID of block: ${JSON.stringify(block)}! Should have been ${this.lastBlock.header.id}`);
    }
  }

  public async getBlock(id: number): Promise<types.Block> {
    return JSON.parse(await this.db.get<string>(id.toString()));
  }

  private async putBlock(block: types.Block): Promise<void> {
    await this.db.put<string>(block.header.id.toString(), JSON.stringify(block));
  }
}
