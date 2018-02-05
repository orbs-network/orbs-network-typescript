import * as path from "path";
import * as fs from "fs";
import * as levelup from "levelup";
import leveldown from "leveldown";

import { logger, config, types, topology, topologyPeers, CryptoUtils, Encoding } from "orbs-common-library";

const crypto = CryptoUtils.loadFromConfiguration();

export default class BlockStorage {
  // The path to the local LevelDB will be of the format: "../../db/[ENVIRONMENT]/blocks_[NODE].db".
  public static readonly LEVELDB_NAME: string = `blocks_${crypto.whoAmI()}.db`;
  public static readonly LEVELDB_PATH: string = path.resolve(path.join("../../", "db", config.getEnvironment(),
    BlockStorage.LEVELDB_NAME));

  public static readonly GENESIS_BLOCK: types.Block = {
    header: {
      version: 0,
      id: 0,
      prevBlockHash: "1219bd8a4a704c42105a1a2f50d3759398f3036f38d29250828e16b5d4ed424b", // Double SHA256 of "".
      timestamp: 1514764800
    },
    tx: { contractAddress: "0", sender: "", signature: "", argumentsJson: "{}" },
    modifiedAddressesJson: "{}"
  };

  private lastBlock: types.Block;
  private db: levelup.LevelUp;

  constructor() {
    // Make sure that the DB directory exists.
    const directory = path.dirname(BlockStorage.LEVELDB_PATH);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    // Open/create the blocks LevelDB database.
    this.db = levelup.default(leveldown(BlockStorage.LEVELDB_PATH));
  }

  public async load(): Promise<void> {
    // Get the hash of the last block and use to get actual block.
    let lastBlockHash;
    try {
      lastBlockHash = await this.get(BlockStorage.LAST_BLOCK_HASH_KEY);
    } catch (e) {
      if (e.notFound) {
        logger.warn("Couldn't get last block hash. Restarting from the genesis block...");

        lastBlockHash = BlockStorage.getBlockHash(BlockStorage.GENESIS_BLOCK);

        await this.put(BlockStorage.LAST_BLOCK_HASH_KEY, lastBlockHash);
        await this.putBlock(lastBlockHash, BlockStorage.GENESIS_BLOCK);
      } else {
        throw e;
      }
    }

    logger.debug("Got last block hash:", lastBlockHash);

    this.lastBlock = await this.getBlock(lastBlockHash);
  }

  // Adds new block to the persistent block storage.
  //
  // NOTE: this method should be only called serially.
  public async addBlock(block: types.Block) {
    // Verify the proposed block:
    if (block.header.id != this.lastBlock.header.id) {
      throw new Error(`Invalid block ID of block: ${block}!`);
    }

    const prevBlockHash = CryptoUtils.sha256(JSON.stringify(this.lastBlock));
    if (block.header.prevBlockHash !== prevBlockHash) {
      throw new Error(`Invalid prev block hash of block: ${block}! Should have been ${prevBlockHash}`);
    }

    logger.debug("Added new block with block ID:", block.header.id);

    this.lastBlock = block;
  }

  public async getBlocks(lastBlockId: number): Promise<types.Block[]> {
    const blocks: types.Block[] = [];

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

  private get(key: string): Promise<string> {
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

  private put(key: string, value: any): Promise<void> {
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

  private async getBlock(doubleHash: string): Promise<types.Block> {
    return JSON.parse(await this.get(doubleHash));
  }

  private async putBlock(doubleHash: string, block: types.Block): Promise<void> {
    await this.put(doubleHash, JSON.stringify(block));
  }
}
