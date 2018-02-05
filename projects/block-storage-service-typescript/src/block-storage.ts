import * as path from "path";
import * as mkdirp from "mkdirp";
import * as levelup from "levelup";
import leveldown from "leveldown";

import { logger, config, types, topology, topologyPeers, CryptoUtils, Encoding } from "orbs-common-library";

const crypto = CryptoUtils.loadFromConfiguration();

export default class BlockStorage {
  // The path to the local LevelDB will be of the format: "../../db/[ENVIRONMENT]/blocks_[NODE].db".
  public static readonly LEVELDB_NAME: string = `blocks_${crypto.whoAmI()}.db`;
  public static readonly LEVELDB_PATH: string = path.resolve(path.join("../../", "db", config.getEnvironment(),
    BlockStorage.LEVELDB_NAME));

  public static readonly LAST_BLOCK_ID_KEY: string = "last";

  public static readonly GENESIS_BLOCK: types.Block = {
    header: {
      version: 0,
      id: 0,
      prevBlockId: -1
    },
    tx: { contractAddress: "0", sender: "", signature: "", argumentsJson: "{}" },
    modifiedAddressesJson: "{}"
  };

  private lastBlock: types.Block;
  private db: levelup.LevelUp;

  public constructor() {
    // Make sure that the DB directory exists.
    const directory = path.dirname(BlockStorage.LEVELDB_PATH);
    mkdirp.sync(directory);

    // Open/create the blocks LevelDB database.
    this.db = levelup.default(leveldown(BlockStorage.LEVELDB_PATH));
  }

  public async load(): Promise<void> {
    // Get the ID of the last block and use it to get actual block.
    let lastBlockId;
    try {
      lastBlockId = await this.get<number>(BlockStorage.LAST_BLOCK_ID_KEY);
    } catch (e) {
      if (e.notFound) {
        logger.warn("Couldn't get last block ID. Restarting from the genesis block...");

        lastBlockId = BlockStorage.GENESIS_BLOCK.header.id;

        await this.put<number>(BlockStorage.LAST_BLOCK_ID_KEY, lastBlockId);
        await this.putBlock(BlockStorage.GENESIS_BLOCK);
      } else {
        throw e;
      }
    }

    logger.info("Got last block ID:", lastBlockId);

    this.lastBlock = await this.getBlock(lastBlockId);
  }

  // Adds new block to the persistent block storage.
  //
  // NOTE: this method should be only called serially.
  public async addBlock(block: types.Block) {
    this.verifyNewBlock(block);

    await this.put<number>(BlockStorage.LAST_BLOCK_ID_KEY, block.header.id);
    await this.putBlock(block);

    this.lastBlock = block;

    logger.info("Added new block with block ID:", block.header.id);
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

  private verifyNewBlock(block: types.Block) {
    if (block.header.id != this.lastBlock.header.id + 1) {
      throw new Error(`Invalid block ID of block: ${block}!`);
    }

    if (block.header.prevBlockId !== this.lastBlock.header.id) {
      throw new Error(`Invalid prev block ID of block: ${block}! Should have been ${this.lastBlock.header.id}`);
    }
  }

  private get<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(key, (error: any, value: any) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(value);
      });
    });
  }

  private put<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.put(key, value, (error: any) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
    });
  }

  private async getBlock(id: number): Promise<types.Block> {
    return JSON.parse(await this.get<string>(id.toString()));
  }

  private async putBlock(block: types.Block): Promise<void> {
    // Update the mapping between block's ID and its contents
    await this.put<string>(block.header.id.toString(), JSON.stringify(block));
  }
}
