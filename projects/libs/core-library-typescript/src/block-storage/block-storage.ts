import * as path from "path";

import { LevelDBDriver } from "./leveldb-driver";
import { BlockUtils, logger, types, JsonBuffer, KeyManager } from "../common-library";
import { STARTUP_STATUS, StartupStatus } from "../common-library/startup-status";
import { StartupCheck } from "../common-library/startup-check";

export interface BlockStorageConfig {
  dbPath: string;
  verifySignature: boolean;
  keyManager?: KeyManager;
}


export class BlockStorage implements StartupCheck {

  public readonly SERVICE_NAME = "block-storage";
  public static readonly LAST_BLOCK_HEIGHT_KEY: string = "last";

  private lastBlock: types.Block;
  private db: LevelDBDriver;
  private transactionPool: types.TransactionPoolClient;
  private config: BlockStorageConfig;

  public constructor(config: BlockStorageConfig, transactionPool: types.TransactionPoolClient) {
    this.config = config;
    // Open/create the blocks LevelDB database.
    this.db = new LevelDBDriver(config.dbPath);
    this.transactionPool = transactionPool;
  }

  public async generateGenesisBlock(): Promise<types.Block> {
    return BlockUtils.buildNextBlock({
      transactions: [],
      transactionReceipts: [],
      stateDiff: []
    });
  }

  public async load(): Promise<void> {
    // Get the ID of the last block and use it to get actual block.
    let lastBlockHeight;
    try {
      lastBlockHeight = await this.db.get<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY);
    } catch (e) {
      if (e.notFound) {
        logger.warn("Couldn't get last block height. Restarting from the genesis block...");

        const genesisBlock = await this.generateGenesisBlock();

        await this.db.put<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY, genesisBlock.header.height);

        await this.putBlock(genesisBlock);

        lastBlockHeight = genesisBlock.header.height;
      } else {
        throw e;
      }
    }

    logger.info(`Got last block height: ${lastBlockHeight}`);

    this.lastBlock = await this.getBlock(lastBlockHeight);
  }

  public async shutdown() {
    logger.info(`Shutting down block storage`);
    return this.db.close();
  }

  // Adds new block to the persistent block storage.
  //
  // NOTE: this method should be only called serially.
  public async addBlock(block: types.Block) {
    const start = new Date().getTime();
    const blockHash = BlockUtils.calculateBlockHash(block).toString("hex");

    logger.info(`Adding new block with block height ${block.header.height} and hash ${blockHash}`);

    await this.verifyNewBlock(block);
    await this.db.put<number>(BlockStorage.LAST_BLOCK_HEIGHT_KEY, block.header.height);
    await this.putBlock(block);
    await this.reportBlockTransactionToPool(block);

    this.lastBlock = block;

    const end = new Date().getTime();
    logger.info(`Added new block with block height: ${block.header.height} and hash ${blockHash} in ${end - start} ms`);
  }

  private async reportBlockTransactionToPool(block: types.Block) {
    const transactionReceipts = block.body.transactionReceipts;
    await this.transactionPool.markCommittedTransactions({ transactionReceipts });
  }

  // Returns an array of blocks, starting from a specific block ID and up to the last block.
  public async getBlocks(fromLastBlockHeight: number): Promise<types.Block[]> {
    const blocks: types.Block[] = [];

    // lastBlock is undefined when the service did not initialize the logic/load() did not run yet
    if (this.lastBlock === undefined) {
      throw new ReferenceError("Block Storage not initiailized");
    }

    for (let i = fromLastBlockHeight; i < this.lastBlock.header.height; ++i) {
      blocks.push(await this.getBlock(i + 1));
    }

    return blocks;
  }

  public async getLastBlock(): Promise<types.Block> {
    return this.lastBlock;
  }

  public async hasNewBlocks(fromLastBlockHeight: number): Promise<boolean> {
    return (await this.getLastBlock()).header.height > fromLastBlockHeight;
  }

  private async verifyNewBlock(block: types.Block) {
    if (this.config.verifySignature) {
      let verified = false;
      try {
        verified = BlockUtils.verifyBlockSignature(block, this.config.keyManager);
      } catch (e) {
        throw new Error(`Invalid block signature: ${e.toString()}`);
      }

      if (!verified) {
        throw new Error(`Invalid block signature: ${JSON.stringify(block.header)} was not signed by ${block.signatureData.signatory}`);
      }
    }

    if (block.header.version !== 0) {
      throw new Error(`Invalid block version: ${block.header.version}!`);
    }

    if (block.header.height !== this.lastBlock.header.height + 1) {
      throw new Error(`Invalid block height of block: ${JSON.stringify(block.header)}! Should have been ${this.lastBlock.header.height + 1}`);
    }

    const lastBlockHash = BlockUtils.calculateBlockHash(this.lastBlock);
    if (!block.header.prevBlockHash.equals(lastBlockHash)) {
      throw new Error(`Invalid prev block hash of block: ${JSON.stringify(block.header)}! Should have been ${JSON.stringify(lastBlockHash)}`);
    }
  }

  public async getBlock(height: number): Promise<types.Block> {
    return JsonBuffer.parseJsonWithBuffers(await this.db.get<string>(height.toString()));
  }

  private async putBlock(block: types.Block): Promise<void> {
    await this.db.put<string>(block.header.height.toString(), JSON.stringify(block));
  }

  public async startupCheck(): Promise<StartupStatus> {

    if (!this.transactionPool) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL };
    }

    let lastBlock;
    try {
      lastBlock = await this.getLastBlock();
    } catch (err) {
      return { name: this.SERVICE_NAME, status: STARTUP_STATUS.FAIL, message: `Exception in getLastBlock: ${err ? err.message : ""}` };
    }
    return { name: this.SERVICE_NAME, status: lastBlock ? STARTUP_STATUS.OK : STARTUP_STATUS.FAIL };
  }
}
